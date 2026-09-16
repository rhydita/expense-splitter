import { useState, useEffect } from "react";

// You can rename these to your own friends' names!
const FRIENDS = ["You", "Rifah", "Emon", "Iqra"];

function loadExpenses() {
  try {
    const raw = localStorage.getItem("split-expenses");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function loadSettlements() {
  try {
    const raw = localStorage.getItem("split-settlements");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export default function App() {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [settlements, setSettlements] = useState(loadSettlements); // { personName: amountAlreadySettled }
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("You");
  const [splitWith, setSplitWith] = useState(["You", "Rifah"]);

  useEffect(() => {
    try {
      localStorage.setItem("split-expenses", JSON.stringify(expenses));
    } catch (e) {}
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem("split-settlements", JSON.stringify(settlements));
    } catch (e) {}
  }, [settlements]);

  function toggleFriend(name) {
    setSplitWith((s) =>
      s.includes(name) ? s.filter((f) => f !== name) : [...s, name]
    );
  }

  function addExpense() {
    const amt = parseFloat(amount);
    if (!desc.trim() || !amt || amt <= 0 || splitWith.length === 0) return;
    setExpenses((e) => [
      ...e,
      {
        id: Date.now(),
        desc: desc.trim(),
        amount: amt,
        payer,
        splitWith: [...splitWith],
      },
    ]);
    setDesc("");
    setAmount("");
  }

  // raw net balance per person from ALL expenses ever logged (before settlements are subtracted)
  const rawNet = {};
  FRIENDS.forEach((f) => (rawNet[f] = 0));
  expenses.forEach((e) => {
    const share = e.amount / e.splitWith.length;
    e.splitWith.forEach((person) => {
      if (person !== e.payer) {
        rawNet[person] -= share;
        rawNet[e.payer] += share;
      }
    });
  });

  // current balance = raw net minus whatever has already been settled for that person
  const currentNet = {};
  FRIENDS.forEach((f) => (currentNet[f] = rawNet[f] - (settlements[f] || 0)));

  function settlePerson(person) {
    setSettlements((s) => ({ ...s, [person]: rawNet[person] }));
  }

  function settleAll() {
    const all = {};
    FRIENDS.forEach((f) => (all[f] = rawNet[f]));
    setSettlements(all);
  }

  const others = FRIENDS.filter((f) => f !== "You");
  const canAdd = desc.trim() && parseFloat(amount) > 0 && splitWith.length > 0;
  const anyUnsettled = others.some((f) => Math.abs(currentNet[f]) > 0.01);

  return (
    <div className="wrap">
      <h1 className="brand">Split</h1>
      <p className="tagline">
        Log an expense in one screen. See who owes what. Settle up.
      </p>

      <div className="card">
        <h2>Add an expense</h2>
        <label>What was it for?</label>
        <input
          type="text"
          placeholder="Groceries, rent, dinner…"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <label>Amount (৳)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label>Who paid?</label>
        <div className="chip-row">
          {FRIENDS.map((f) => (
            <div
              key={f}
              className={"chip" + (payer === f ? " active" : "")}
              onClick={() => setPayer(f)}
            >
              {f}
            </div>
          ))}
        </div>

        <label>Split between</label>
        <div className="chip-row">
          {FRIENDS.map((f) => (
            <div
              key={f}
              className={"chip" + (splitWith.includes(f) ? " active" : "")}
              onClick={() => toggleFriend(f)}
            >
              {f}
            </div>
          ))}
        </div>

        <button className="primary" disabled={!canAdd} onClick={addExpense}>
          Add expense
        </button>
      </div>

      <div className="card">
        <h2>Balances</h2>
        {others.map((f) => {
          const bal = currentNet[f];
          const isSettled = Math.abs(bal) <= 0.01;
          return (
            <div className="balance-row" key={f}>
              <div className="who">
                <b>{f}</b>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {bal > 0.01 ? (
                  <span className="amt get">gets ৳{bal.toFixed(2)}</span>
                ) : bal < -0.01 ? (
                  <span className="amt owe">owes ৳{Math.abs(bal).toFixed(2)}</span>
                ) : (
                  <span className="amt" style={{ color: "var(--ink-soft)" }}>
                    settled
                  </span>
                )}
                {!isSettled && (
                  <button
                    className="settle-btn"
                    onClick={() => settlePerson(f)}
                  >
                    Settle
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {anyUnsettled && (
          <button
            className="settle-btn"
            style={{ marginTop: 14, width: "100%" }}
            onClick={settleAll}
          >
            Mark all as settled
          </button>
        )}
      </div>

      <div className="card">
        <h2>Expense history</h2>
        {expenses.length === 0 && (
          <div className="empty">No expenses yet — add one above.</div>
        )}
        {expenses
          .slice()
          .reverse()
          .map((e) => (
            <div className="expense-item" key={e.id}>
              <div>
                <div>{e.desc}</div>
                <div className="expense-meta">
                  {e.payer} paid · split {e.splitWith.length} ways
                </div>
              </div>
              <div className="total-pill">৳{e.amount.toFixed(2)}</div>
            </div>
          ))}
      </div>

      <footer></footer>
    </div>
  );
}