import { KART_DENOM, STAKING_ADDR } from "@/constant/token";
import { TAppState, TAppStore } from "./app.type";
import { fromHumanString, msg, toHuman } from "kujira.js";
import { create } from "zustand";

import { BigNumber } from "@ethersproject/bignumber";
import { coin } from "@cosmjs/proto-signing";
import { stakingApiService } from "@/lib/service";
import { ETXTYPE } from "@/constant/stake";

const initialState: TAppState = {
  kujiBalance: 0,
  kartBalance: 0,
  kartPrice: 0,
  stakedAmt: 0,
  rewards: 0,
  claims: [],
  loading: false,
};

const useAppStore = create<TAppStore>((set, get) => {
  return {
    app: initialState,
    actions: {
      async getAppInfo(query) {
        get().actions.setLoading(true);
      },

      async initializeAppInfo() {
        set({
          app: initialState,
        });
      },

      async getUserInfo(owner, query) {
        get().actions.setLoading(true);

        if (!owner) {
          set({
            app: initialState,
          });
          get().actions.setLoading(false);
          return;
        }

        try {
          let kujiBalance, kartBalance;

          await query.bank.allBalances(owner).then((x) => {
            x?.map((b) => {
              if (b.denom === "ukuji") kujiBalance = b.amount;
              if (b.denom === KART_DENOM) kartBalance = b.amount;
            });
          });

          const stakedAmt = await query.wasm.queryContractSmart(STAKING_ADDR, {
            staked: { address: owner },
          });

          const claims = await query.wasm
            .queryContractSmart(STAKING_ADDR, { claims: { address: owner } })
            .then((x) => x?.claims ?? []);

          set({
            app: {
              ...get().app,
              kujiBalance: Number(toHuman(BigNumber.from(kujiBalance ?? 0), 6)),
              kartBalance: Number(kartBalance ?? 0),
              stakedAmt: stakedAmt?.stake ?? 0,
              claims,
            },
          });
        } catch (err) {
          console.error(err);
          get().actions.setLoading(false);
        } finally {
          get().actions.setLoading(false);
        }
      },

      async bond(amount, sender, sign, query) {
        get().actions.setLoading(true);

        try {
          const executeMsg = msg.wasm.msgExecuteContract({
            contract: STAKING_ADDR,
            sender: sender,
            msg: Buffer.from(JSON.stringify({ bond: {} })),
            funds: [
              coin(fromHumanString(String(amount), 6).toNumber(), KART_DENOM),
            ],
          });

          const tx = await sign([executeMsg], "Lock KART");

          await get().actions.getUserInfo(sender, query);
          await get().actions.getAppInfo(query);
          const res = await stakingApiService.stakeToken({
            address: sender,
            amount: amount,
            txHash: tx.transactionHash,
            txDate: new Date(),
            txType: ETXTYPE.STAKE
          })
          console.log({ res })
        } catch (err) {
          console.error(err);
          get().actions.setLoading(false);
          throw err;
        } finally {
          get().actions.setLoading(false);
        }
      },

      async unbond(amount, sender, sign, query) {
        get().actions.setLoading(true);

        try {
          const executeMsg = msg.wasm.msgExecuteContract({
            contract: STAKING_ADDR,
            sender: sender,
            msg: Buffer.from(
              JSON.stringify({
                unbond: {
                  tokens: fromHumanString(String(amount), 6).toString(),
                },
              }),
            ),
            funds: [],
          });

          const tx = await sign([executeMsg], "Unlock KART");

          await get().actions.getUserInfo(sender, query);
          await get().actions.getAppInfo(query);
          const res = await stakingApiService.stakeToken({
            address: sender,
            amount: amount,
            txHash: tx.transactionHash,
            txDate: new Date(),
            txType: ETXTYPE.UNSTAKE
          })
          console.log({ res })
        } catch (err) {
          console.error(err);
          get().actions.setLoading(false);
          throw err;
        } finally {
          get().actions.setLoading(false);
        }
      },

      async claim() { },

      async unlock() { },

      setLoading(status: boolean) {
        set({
          app: {
            ...get().app,
            loading: status,
          },
        });
      },
    },
  };
});

export const useAppState = () => useAppStore((state) => state.app);
export const useAppActions = () => useAppStore((state) => state.actions);
