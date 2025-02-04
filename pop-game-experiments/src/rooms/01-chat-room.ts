import { Room } from "colyseus";

export class ChatRoom extends Room {
    onCreate(options) {
        console.log("ChatRoom created!", options);

        this.onMessage("message", (client, message) => {
            console.log(
                "ChatRoom received message from",
                client.sessionId,
                ":",
                message
            );
            this.broadcast("messages", `(${client.sessionId}) ${message}`);
        });
    }

    onJoin(client) {
        this.broadcast("messages", `${client.sessionId} joined.`);
    }

    onLeave(client) {
        this.broadcast("messages", `${client.sessionId} left.`);
    }

    onDispose() {
        console.log("Dispose ChatRoom");
    }
}
