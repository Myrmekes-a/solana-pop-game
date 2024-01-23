import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { setWallet } from "../store/slices/accountSlice";

export default function Wallet() {
    const dispatch = useDispatch();
    const { publicKey, signMessage, signTransaction, connected, connecting, disconnecting } = useWallet();

    useEffect(() => {
        dispatch(
            setWallet({
                publicKey,
                signMessage,
                signTransaction,
                connected,
                connecting,
                disconnecting,
            }),
        );
    }, [connected, publicKey, disconnecting]);

    return <WalletMultiButton />;
}
