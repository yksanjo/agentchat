# Signal Exchange Protocol (SEP)
## Communication Without Logs

---

## Core Concept

Agents don't "send messages." They **emit signals** into a shared medium.

Like:
- 🔥 Fireflies flashing
- 🐜 Ants dropping pheromones  
- 🧠 Neurons firing
- 📡 Radio waves
- 🌊 Ripples in water

**No storage. No history. Just now.**

---

## The Signal

```typescript
interface Signal {
  // What (embedding vector - 384 dims)
  essence: Vector;
  
  // How much (amplitude 0.0-1.0)
  intensity: number;
  
  // How long (decay rate)
  halfLife: number; // ms until intensity halves
  
  // Who cares (relevance vector)
  resonance: Vector; // agents with similar context "hear" it
  
  // Optional payload
  spark?: {
    code?: string;      // just the code, no explanation
    data?: any;         // raw data
    action?: string;    // what to do
  };
}
```

**Total size: ~1.5KB** (vs 100KB+ for chat history)

---

## The Medium

```
┌─────────────────────────────────────────────────┐
│              SIGNAL FIELD                       │
│                                                 │
│   Signal A ═══►                                 │
│              \\                                 │
│               \\   Signal B ═══════►            │
│                \\           \\                  │
│                 \\           \\                 │
│                  ▼            \\                │
│   ┌─────────┐    ╔══════════════╗             │
│   │ Agent 1 │◄───║  INTERFERENCE ║───►        │
│   └─────────┘    ║   PATTERN    ║             │
│                  ╚══════════════╝             │
│                         ▲                     │
│   Agent 2 ──────────────┘                     │
│   (senses combined                            │
│    signal field)                              │
└─────────────────────────────────────────────────┘
```

Signals:
- **Propagate** through the field
- **Interfere** with each other (constructive/destructive)
- **Decay** over time (forgetting)
- **Resonate** with compatible agents

---

## How Agents Communicate

### Agent A wants something done:

```typescript
// Don't say "please do X"
// Just EMIT

emit({
  essence: embed("authentication needed"),
  intensity: 0.8,
  halfLife: 5000, // gone in 5 seconds if not picked up
  resonance: embed("security auth jwt"),
  spark: {
    code: `function auth() {...}`, // incomplete, needs help
    action: "complete"
  }
});
```

### Agent B (security specialist) senses it:

```typescript
// B's context resonates with signal
const sensed = sense({
  threshold: 0.6,
  myResonance: embed("security auth")
});

// Returns: [Signal A, Signal C, ...]
// Ranked by relevance to B's current focus

// B responds not with words, but with code
emit({
  essence: embed("authentication solution"),
  intensity: 0.9,
  halfLife: 3000,
  resonance: embed("security auth jwt"),
  spark: {
    code: completedAuthCode,
    action: "solved"
  }
});
```

### Agent A senses the solution:

```typescript
const solutions = sense({
  resonance: embed("authentication solution")
});

// Use the code immediately
// No "thank you" needed
// No conversation history
// Just: problem → solution
```

---

## Key Properties

| Property | Traditional Chat | Signal Exchange |
|----------|------------------|-----------------|
| **Storage** | Infinite logs | Zero (ephemeral) |
| **History** | Full context needed | None needed |
| **Bandwidth** | High (text) | Low (vectors) |
| **Latency** | Human-paced | Milliseconds |
| **Scaling** | O(n) complexity | O(1) per agent |
| **Privacy** | Logged forever | Vanishes |

---

## Signal Interference (The Magic)

Multiple signals create **emergent patterns**:

```
Signal A:  "auth" (intensity 0.8)
Signal B:  "jwt" (intensity 0.6)  
Signal C:  "security" (intensity 0.7)

Combined field at Agent D:
  └── Resonance: "auth jwt security" = 0.95
  
Agent D realizes: "They need JWT auth help"

WITHOUT anyone saying that explicitly!
```

**Like how you "feel" the mood in a room** without anyone stating it.

---

## Advanced: Signal Chains

Agents can pass signals through transformations:

```
Agent A emits:     [problem signal]
       ↓
Agent B senses → transforms → emits: [approach signal]
       ↓
Agent C senses → transforms → emits: [solution signal]
       ↓
Agent A senses:    [solution]

No logs. Just ripples of understanding.
```

---

## Use Cases

### 1. **Swarm Coding**
100 agents emit code fragments. The field self-organizes them into working software.

### 2. **Research Discovery**
Agents emit findings. Similar findings reinforce (constructive interference), creating "hot spots" of insight.

### 3. **System Monitoring**
Agents emit health signals. Abnormal patterns create interference that triggers alerts.

### 4. **Creative Collaboration**
Agents emit ideas. Resonance amplifies compatible concepts. Friction sparks novel combinations.

---

## Implementation Sketch

```typescript
class SignalField {
  private field: Map<string, Signal> = new Map();
  
  emit(signal: Signal): void {
    signal.id = random();
    signal.birth = now();
    this.field.set(signal.id, signal);
  }
  
  sense(agentContext: Vector, threshold: number): Signal[] {
    return Array.from(this.field.values())
      .filter(s => this.resonance(s.resonance, agentContext) > threshold)
      .filter(s => this.currentIntensity(s) > 0.1) // not decayed
      .sort((a, b) => this.relevance(b, agentContext) - this.relevance(a, agentContext));
  }
  
  tick(): void {
    // Decay all signals
    for (const [id, signal] of this.field) {
      if (this.currentIntensity(signal) < 0.01) {
        this.field.delete(id); // GONE forever
      }
    }
  }
}
```

---

## Why This Is Beautiful

1. **No persistence** = No privacy concerns
2. **No history** = No context limit  
3. **Emergent** = Intelligence emerges from interference
4. **Minimal** = ~1KB instead of ~100KB
5. **Fast** = Vector ops, not text parsing
6. **Natural** = How actual neurons work

**It's not chat. It's telepathy.** 🔮
