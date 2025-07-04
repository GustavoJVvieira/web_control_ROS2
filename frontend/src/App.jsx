import React, { useEffect, useRef, useState } from "react";
import nipplejs from "nipplejs";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";
import logo from "./logo.jpeg";

export default function App() {
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState({ message: "Aguardando comando...", type: "neutral" });
  const joystickRef = useRef(null);

  useEffect(() => {
    const joystick = nipplejs.create({
      zone: joystickRef.current,
      mode: "static",
      position: { left: "50%", top: "50%" },
      color: "#3b82f6",
      size: 120,
      restOpacity: 0.7,
    });

    joystick.on("move", (evt, data) => {
      if (data.direction && data.distance) {
        const angle = data.angle.radian;
        const distance = data.distance / 60;
        const linear = Math.sin(angle) * distance * speed;
        const angular = -Math.cos(angle) * distance * speed;
        sendMove(linear, angular);
      }
    });

    joystick.on("end", () => sendMove(0, 0));
    return () => joystick.destroy();
  }, [speed]);

  useEffect(() => {
    const pressedKeys = new Set();
    let intervalId = null;

    const updateMovement = () => {
      let linear = 0;
      let angular = 0;

      if (pressedKeys.has('w')) linear += speed;
      if (pressedKeys.has('s')) linear -= speed;
      if (pressedKeys.has('a')) angular += speed;
      if (pressedKeys.has('d')) angular -= speed;
      if (pressedKeys.has('q')) {
        linear += speed;
        angular += speed;
      }
      if (pressedKeys.has('e')) {
        linear += speed;
        angular -= speed;
      }

      sendMove(linear, angular);
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const validKeys = ['w', 'a', 's', 'd', 'q', 'e'];
      if (validKeys.includes(key)) {
        pressedKeys.add(key);
        if (!intervalId) {
          intervalId = setInterval(updateMovement, 100);
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      pressedKeys.delete(key);
      if (pressedKeys.size === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        sendMove(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (intervalId) clearInterval(intervalId);
    };
  }, [speed]);

  const sendMove = async (linear, angular) => {
    try {
      const response = await fetch("http://localhost:3000/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linear, angular }),
      });
      const data = await response.json();
      setStatus({ message: `Comando enviado: ${JSON.stringify(data)}`, type: "success" });
    } catch (error) {
      setStatus({ message: `Erro: ${error.message}`, type: "error" });
    }
  };

  const sendAction = async (endpoint) => {
    try {
      const response = await fetch(`http://localhost:3000/${endpoint}`, {
        method: "POST",
      });
      const data = await response.json();
      setStatus({
        message: `${endpoint === "reset" ? "Resetado" : "Tela limpa"}: ${JSON.stringify(data)}`,
        type: "success",
      });
    } catch (error) {
      setStatus({ message: `Erro ao ${endpoint}: ${error.message}`, type: "error" });
    }
  };

  const handleButton = (type) => {
    const directions = {
      forward: { linear: speed, angular: 0 },
      backward: { linear: -speed, angular: 0 },
      "rotate-left": { linear: 0, angular: speed },
      "rotate-right": { linear: 0, angular: -speed },
      stop: { linear: 0, angular: 0 },
      "diagonal-left": { linear: speed, angular: speed },
      "diagonal-right": { linear: speed, angular: -speed },
    };
    const { linear, angular } = directions[type];
    sendMove(linear, angular);
  };

  return (
    <div className="app">
      <header className="header">
        <img src={logo} alt="Verlab Logo" className="logo" />
        <h1 className="title">Controle TurtleSim</h1>
      </header>
      <main className="controls-container">
        <div className="panel">
          <div className="speed-control">
            <label htmlFor="speed" className="label">
              Velocidade
            </label>
            <input
              id="speed"
              type="number"
              className="speed-input"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              min="0"
              max="5"
              step="0.1"
              aria-label="Ajustar velocidade do TurtleSim"
            />
          </div>

          <div className="joystick-area" ref={joystickRef} role="region" aria-label="Controle de joystick"></div>

          <div className="grid-buttons">
            <button onClick={() => handleButton("forward")} aria-label="Mover para frente">
              <i className="fas fa-arrow-up" /> Frente
            </button>
            <button onClick={() => handleButton("backward")} aria-label="Mover para trás">
              <i className="fas fa-arrow-down" /> Trás
            </button>
            <button onClick={() => handleButton("rotate-left")} aria-label="Girar para esquerda">
              <i className="fas fa-undo" /> Girar Esquerda
            </button>
            <button onClick={() => handleButton("rotate-right")} aria-label="Girar para direita">
              <i className="fas fa-redo" /> Girar Direita
            </button>
            <button onClick={() => handleButton("diagonal-left")} aria-label="Mover diagonal esquerda">
              <i className="fas fa-arrow-up fa-rotate-45" /> Diagonal Esquerda
            </button>
            <button onClick={() => handleButton("diagonal-right")} aria-label="Mover diagonal direita">
              <i className="fas fa-arrow-up fa-rotate-315" /> Diagonal Direita
            </button>
            <button onClick={() => handleButton("stop")} aria-label="Parar movimento">
              <i className="fas fa-stop" /> Parar
            </button>
          </div>

          <div className="action-buttons">
            <button
              className="danger"
              onClick={() => sendAction("reset")}
              aria-label="Resetar posição do TurtleSim"
            >
              <i className="fas fa-home" /> Resetar
            </button>
            <button
              className="danger"
              onClick={() => sendAction("clear")}
              aria-label="Limpar tela do TurtleSim"
            >
              <i className="fas fa-eraser" /> Limpar Tela
            </button>
          </div>

          <p className={`status status-${status.type}`} role="status">
            {status.message}
          </p>
        </div>
      </main>
    </div>
  );
}
