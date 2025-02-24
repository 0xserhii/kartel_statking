import Footer from "./footer";
import Header from "./header";
import { ReactNode, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { useAppActions } from "@/store/app.store";
import { useNetwork } from "@/provider/crypto/network";
import { useWallet } from "@/provider/crypto/wallet";
import Loading from "../loading";

export default function AppLayouts({ children }: { children: ReactNode }) {
  const { getAppInfo, getUserInfo, initializeAppInfo } = useAppActions();

  const [{ query }] = useNetwork();
  const { account } = useWallet();

  useEffect(() => {
    if (query) {
      getAppInfo(query);
      if (account) {
        getUserInfo(account.address, query);
      } else {
        initializeAppInfo()
      }
    }
  }, [account?.address, query]);

  return (
    <>
      <div className="relative h-screen flex flex-col bg-opacity-90 bg-gradient-to-b from-dark to-dark bg-blend-multiply">
        <Header />
        <div className="relative w-full grow overflow-y-auto">
          <ScrollArea className="w-full h-full">{children}</ScrollArea>
        </div>
        <Footer />
        <Loading />
      </div>
    </>
  );
}
