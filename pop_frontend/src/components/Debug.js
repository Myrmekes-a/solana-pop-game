// Just something to render out stuff for testing
function Debug({ enableDebug, players, balloons, currentState }) {
    const renderPlayers = players => {
        return (
            <div
                style={{
                    display: "flex",
                    border: "solid",
                }}
                id="debug"
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Players</div>
                    {players &&
                        Object.entries(players).map(keyValue => {
                            return <div>{`${keyValue[0]}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Credits</div>
                    {players &&
                        Object.entries(players).map(keyValue => {
                            return <div>{`${keyValue[1].credits}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>StartingBalloons</div>
                    {players &&
                        Object.entries(players).map(keyValue => {
                            return <div>{`${keyValue[1].startingBalloons}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Remaining Balloons</div>
                    {players &&
                        Object.entries(players).map(keyValue => {
                            return <div>{`${keyValue[1].remainingBalloons}`}</div>;
                        })}
                </div>
            </div>
        );
    };

    const renderBalloons = balloons => {
        return (
            <div
                style={{
                    display: "flex",
                    border: "solid",
                    marginTop: "1vh",
                }}
                id="debug-balloons"
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Balloon Label</div>
                    {balloons &&
                        Object.entries(balloons).map(keyValue => {
                            return <div>{`${keyValue[0]}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>X</div>
                    {balloons &&
                        Object.entries(balloons).map(keyValue => {
                            return <div>{`${keyValue[1].x.toFixed(4)}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Y</div>
                    {balloons &&
                        Object.entries(balloons).map(keyValue => {
                            return <div>{`${keyValue[1].y.toFixed(4)}`}</div>;
                        })}
                </div>
                <div
                    className="debug-column"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div>Balloon State</div>
                    {balloons &&
                        Object.entries(balloons).map(keyValue => {
                            return <div>{`${keyValue[1].balloonState}`}</div>;
                        })}
                </div>
            </div>
        );
    };

    return (
        <div>
            {true && (
                <div
                    style={{
                        left: "500px",
                        top: "500px",
                        display: "flex",
                        position: "absolute",
                        flexDirection: "column",
                    }}
                >
                    {renderPlayers(players)}
                    {renderBalloons(balloons)}
                </div>
            )}
        </div>
    );
}

export default Debug;
