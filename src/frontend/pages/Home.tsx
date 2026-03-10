const FLEET_ART = `
      |      |      |      |
     /|\\    /|\\    /|\\    /|\\
    / | \\  / | \\  / | \\  / | \\
   /  |  \\/  |  \\/  |  \\/  |  \\
  /   |   /   |   /   |   /   |  \\
 /    |  /    |  /    |  /    |   \\
/_____|_/_____|_/_____|_/_____|____\\
|  F  | |  L  | |  E  | |  E  | T |
|_____|_|_____|_|_____|_|_____|____|
 ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~
~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~
`.trim();

export default function Home() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">Welcome to Fleet</h1>
        <p className="text-base-content/60 mb-8 text-lg">
          Your AI agent management hub
        </p>
        <pre className="text-sm text-primary bg-base-200 rounded-xl p-6 inline-block text-left border border-base-300 shadow-sm">
          {FLEET_ART}
        </pre>
        <p className="mt-8 text-base-content/40 text-sm">
          Select a project from the sidebar to get started
        </p>
      </div>
    </div>
  );
}
