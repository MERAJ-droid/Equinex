"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useStarknetContext } from "@/context";
import { usePathname } from "next/navigation";
import Image from "next/image";
import StartupFundingABI from "@/abi/StartupFunding.json"; // Import the ABI
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  IconHome,
  IconRocket,
  IconCopyright,
  IconWallet,
  IconShield,
  IconSettings,
  IconLayoutNavbarCollapse,
} from "@tabler/icons-react";

export function Navbar() {
  const { starknetAddress, connectStarknet } = useStarknetContext();
  const pathname = usePathname();
  const [starknetBalance, setStarknetBalance] = useState<string | null>(null);

  const STARKNET_CONTRACT_ADDRESS = "0x2ffc54642a077281f1af9a0dee27de490d988dbd8d4e99b0bd677f053a9a876";
  useEffect(() => {
    const fetchStarknetBalance = async () => {
      if (starknetAddress) {
        try {
          const { Provider, Contract } = await import("starknet");
          const provider = new Provider({ sequencer: { network: "sepolia-testnet" } });

          // Initialize the contract
          const contract = new Contract(StartupFundingABI, STARKNET_CONTRACT_ADDRESS, provider);

          // Call the `balance_of` function
          const balanceWei = await contract.balance_of(starknetAddress);

          // Convert from wei to ETH
          const balanceEth = Number(balanceWei[0]) / 10 ** 18;
          setStarknetBalance(balanceEth.toFixed(4));
        } catch (error) {
          console.error("Error fetching StarkNet balance:", error);
        }
      }
    };

    fetchStarknetBalance();
  }, [starknetAddress]);

  const navItems = [
    { title: "Home", icon: <IconHome className="h-full w-full" />, href: "/" },
    { title: "Startups", icon: <IconRocket className="h-full w-full" />, href: "/startups" },
    { title: "IP Assets", icon: <IconCopyright className="h-full w-full" />, href: "/ip-assets" },
    { title: "Portfolio", icon: <IconWallet className="h-full w-full" />, href: "/portfolio" },
    { title: "Verification", icon: <IconShield className="h-full w-full" />, href: "/verification" },
    { title: "Admin", icon: <IconSettings className="h-full w-full" />, href: "/admin/verification" },
  ];

  const ConnectButton = () => {
    const { starknetAddress, connectStarknet } = useStarknetContext();
    const [starknetBalance, setStarknetBalance] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchStarknetBalance = async () => {
        if (starknetAddress) {
          try {
            const { Provider, Contract } = await import("starknet");
            const provider = new Provider({ sequencer: { network: "sepolia-testnet" } });
  
            // Initialize the contract
            const contract = new Contract(StartupFundingABI, STARKNET_CONTRACT_ADDRESS, provider);
  
            // Check if the balance_of function exists
            if (typeof contract.balance_of !== "function") {
              console.error("balance_of function not found in the contract");
              return;
            }
  
            // Call the `balance_of` function
            const balanceWei = await contract.balance_of(starknetAddress);
  
            // Convert from wei to ETH
            const balanceEth = Number(balanceWei[0]) / 10 ** 18;
            setStarknetBalance(balanceEth.toFixed(4));
          } catch (error) {
            console.error("Error fetching StarkNet balance:", error);
          }
        }
      };
  
      fetchStarknetBalance();
    }, [starknetAddress]);
  
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={connectStarknet}
          className="bg-[#FF5F1F] text-white font-medium px-4 py-2 rounded-md hover:bg-[#E54D1B] transition-colors flex gap-2"
        >
          <Image height={24} width={24} src="/argentx.png" alt="ArgentX logo" />
          {starknetAddress ? (
            <>
              {starknetAddress.substring(0, 6)}...{starknetAddress.substring(starknetAddress.length - 4)} {" "}
              {/* {starknetBalance || ""} STRK */}
            </>
          ) : (
            "Connect StarkNet"
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <ConnectButton />
      <FloatingDock
        items={navItems}
        desktopClassName="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        mobileClassName="fixed bottom-8 right-8 z-50"
      />
    </>
  );
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => (
  <>
    <FloatingDockDesktop items={items} className={desktopClassName} />
    <FloatingDockMobile items={items} className={mobileClassName} />
  </>
);

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute bottom-full mb-2 inset-x-0 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    pathname === item.href
                      ? "bg-[#00E6E6] text-[#1a1a1a]"
                      : "bg-gray-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center shadow-lg"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-16 gap-4 items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 px-4 pb-3 shadow-lg",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          {...item}
          isActive={pathname === item.href}
        />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  isActive,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center relative",
          isActive
            ? "bg-[#00E6E6] text-[#1a1a1a]"
            : "bg-gray-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute left-1/2 -translate-x-1/2 -top-8 w-fit text-xs"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}

export default Navbar;