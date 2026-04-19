"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton, rarityColors } from "@/components/ui";
import {
  loadBattleSetup,
  loadBattleResult,
  saveBattleResult,
  isBattleRewardApplied,
  markBattleRewardApplied,
} from "@/lib/battleStorage";
import { simulateBattle, type BattleResultData } from "@/lib/battleMock";
import { addWalletCoins, getWalletCoins } from "@/lib/walletStorage";

export default function BattleResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<BattleResultData | null>(null);
  const [walletAfter, setWalletAfter] = useState<number | null>(null);

  useEffect(() => {
    const storedResult = loadBattleResult();

    if (storedResult) {
      setResult(storedResult);

      if (isBattleRewardApplied()) {
        setWalletAfter(getWalletCoins());
      } else {
        const updatedWallet = addWalletCoins(storedResult.rewardCoins);
        markBattleRewardApplied();
        setWalletAfter(updatedWallet);
      }

      return;
    }

    const setup = loadBattleSetup();
    if (!setup) return;

    const simulated = simulateBattle(setup.mode, setup.playerDeck, setup.enemyDeck);
    saveBattleResult(simulated);
    setResult(simulated);

    const updatedWallet = addWalletCoins(simulated.rewardCoins);
    markBattleRewardApplied();
    setWalletAfter(updatedWallet);
  }, []);

  if (!result) {
    return (
      <PageShell>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>No battle data found</div>
          <div style={{ marginTop: 10, fontSize: 14, color: "#a1a1aa" }}>
            Start a battle first from the battle setup screen.
          </div>
        </div>
      </PageShell>
    );
  }

  const win = result.winner === "player";
  const mvpTone = result.mvp ? rarityColors(result.mvp.rarity) : null;

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: win ? "#86efac" : "#fca5a5",
          }}
        >
          {win ? "Victory" : "Defeat"}
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          {result.mode} battle completed
        </div>
      </div>

      <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Score Summary</div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Your Score</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
              {result.playerScore}
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Enemy Score</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
              {result.enemyScore}
            </div>
          </div>
        </div>
      </div>

      {result.mvp && mvpTone && (
        <div
          style={{
            padding: 20,
            marginBottom: 16,
            borderRadius: 24,
            border: `1px solid ${mvpTone.border}`,
            background: mvpTone.bg,
          }}
        >
          <div style={{ fontSize: 13, color: "#a1a1aa" }}>MVP</div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>
            {result.mvp.name}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: "#d4d4d8" }}>
            {result.mvp.rarity} • {result.mvp.type} • {result.mvp.universe}
          </div>
        </div>
      )}

      <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Rewards</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Wallet updated after this battle
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 30,
            fontWeight: 800,
            color: result.rewardCoins >= 0 ? "#fef08a" : "#fca5a5",
          }}
        >
          {result.rewardCoins > 0 ? `+${result.rewardCoins}` : result.rewardCoins} Coins
        </div>

        <div style={{ marginTop: 12, fontSize: 14, color: "#d4d4d8" }}>
          Current balance: {walletAfter ?? getWalletCoins()} Coins
        </div>
      </div>

      <div
        style={{
          ...glassCard(),
          padding: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <button style={primaryButton()} onClick={() => router.push("/battle")}>
          Rematch
        </button>

        <button style={secondaryButton()} onClick={() => router.push("/")}>
          Back Home
        </button>
      </div>
    </PageShell>
  );
}