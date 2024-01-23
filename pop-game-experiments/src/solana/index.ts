import { Connection } from "@solana/web3.js";
import { SOLANA_PRC_URL } from "../config";

const connection = new Connection(SOLANA_PRC_URL);

export default connection;
