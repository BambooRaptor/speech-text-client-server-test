import { google } from "@google-cloud/speech/build/protos/protos.js";
import { v1p1beta1 } from '@google-cloud/speech'
import chalk from "chalk";
import { Stream } from "stream";

let ongoing_streams: Record<string, object> = {};

export function new_transcription_stream() {
	let client: v1p1beta1.SpeechClient = new v1p1beta1.SpeechClient();

	let request_config: google.cloud.speech.v1p1beta1.IStreamingRecognitionConfig = {
		config: {
			encoding: 'LINEAR16',
			sampleRateHertz: 48000,
			languageCode: 'en-IN',
			enableAutomaticPunctuation: true,
			model: 'latest_long',
			useEnhanced: true,
		},
		interimResults: true
	}

	let streaming_limit = 290000;
	let restart_counter = 0;

	let recognize_stream = null;

	let audio_input = [];
	let last_audio_input = [];

	let result_end_time = 0;
	let is_final_end_time = 0;

	let final_request_end_time = 0;

	let new_stream = true;

	let bridging_offset = 0;

	let last_transcript_was_final = false;

	async function start_stream() {
		// clear current audio input
		audio_input = [];

		console.log(`START STREAM: ${await client.getProjectId()}`);

		recognize_stream = client
			.streamingRecognize(request_config)
			.on('error', (err) => {
				console.log(`[ERROR] Transcript failed`);
				console.log(`[ERROR] ${err.message}`);
			})
			.on('data', speech_callback);
	}

	function speech_callback(stream) {
		result_end_time = (stream.results[0].resultEndTime.seconds * 1000) + Math.round(stream.results[0].resultEndTime.nanos / 1000000);

		const corrected_time = result_end_time - bridging_offset + streaming_limit + restart_counter;

		process.stdout.clearLine(-1);
		process.stdout.cursorTo(0);

		let stdout_text = '';
		if (stream.results[0] && stream.results[0].alternatives[0]) {
			stdout_text = `[TRANSCRIPT] ${corrected_time}: ${stream.results[0].alternatives[0].transcript}`;
		}

		if (stream.results[0].isFinal) {
			process.stdout.write(chalk.green(`${stdout_text}\n`));

			is_final_end_time = result_end_time;
			last_transcript_was_final = true;
		} else {
			// make sure the transcript length does not exceed console char limit
			if (stdout_text.length > process.stdout.columns) {
				stdout_text = stdout_text.substring(0, process.stdout.columns - 4) + '...';
			}
			process.stdout.write(chalk.red(`${stdout_text}\n`));

			last_transcript_was_final = false;
		}
	}

	const audio_input_stream_transform = new Stream.Writable({
		write(chunk, encoding, next) {
			if (new_stream && last_audio_input.length != 0) {
				// approx time of chunk
				const chunk_time = streaming_limit / last_audio_input.length;

				if (chunk_time != 0) {
					if (bridging_offset < 0) {
						bridging_offset = 0;
					}
					if (bridging_offset > final_request_end_time) {
						bridging_offset = final_request_end_time;
					}

					const chunks_from_ms = Math.floor((final_request_end_time - bridging_offset) / chunk_time);
					bridging_offset = Math.floor((last_audio_input.length - chunks_from_ms) * chunk_time);

					for (let i = chunks_from_ms; i < last_audio_input.length; i++) {
						recognize_stream.write(last_audio_input[i]);
					}
				}
				new_stream = false;
			}

			audio_input.push(chunk);

			if (recognize_stream) {
				recognize_stream.write(chunk);
			}

			next();
		},
		final() {
			if (recognize_stream) {
				recognize_stream.end();
			}
		}
	})

	function restart_stream() {
		if (recognize_stream) {
			recognize_stream.end();
			recognize_stream.removeListener('data', speech_callback);
			recognize_stream = null;
		}

		if (result_end_time > 0) {
			final_request_end_time = is_final_end_time;
		}

		result_end_time = 0;

		last_audio_input = []
		last_audio_input = audio_input;

		restart_counter++;

		if (!last_transcript_was_final) {
			process.stdout.write('\n');
		}

		process.stdout.write(
			chalk.yellow(`${streaming_limit * restart_counter}: RESTARTING REQUEST\n`)
		);

		new_stream = true;

		start_stream();
	}


	console.log('');
	console.log('Listening, press [Ctrl + C] to stop.');
	console.log('');
	console.log('End (ms)	Transcrpit Result Status');
	console.log('=======================================');

	start_stream();

	return audio_input_stream_transform;
}
