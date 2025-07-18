import ConversationInterface from './components/ConversationInterface.jsx';
import './App.css';

function App() {
  // Agent ID yang diberikan oleh user
  const agentId = 'agent_01jz0apm4sfc59m063j29dpyge';

  return (
    <div className="App">
      <ConversationInterface agentId={agentId} />
    </div>
  );
}

export default App;

