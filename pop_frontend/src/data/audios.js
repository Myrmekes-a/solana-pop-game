import depositSound from "../assets/sounds/deposit_sound.mp3";
import poppingSound from "../assets/sounds/balloon_popping_alt.mp3";
import firingSound from "../assets/sounds/arrow_firing.mp3";
import winningSound from "../assets/sounds/win-sound.wav";
import chatInSound from "../assets/sounds/chat-in.mp3";
import chatOutSound from "../assets/sounds/chat-out.mp3";
import gamblingSound from "../assets/sounds/gambling.mp3";

const depositAudio = new Audio(depositSound);
const poppingAudio = new Audio(poppingSound);
const firingAudio = new Audio(firingSound);
const winningAudio = new Audio(winningSound);
const chatInAudio = new Audio(chatInSound);
const chatOutAudio = new Audio(chatOutSound);
const gamblingAudio = new Audio(gamblingSound);

export { depositAudio, poppingAudio, firingAudio, winningAudio, chatInAudio, chatOutAudio, gamblingAudio };
