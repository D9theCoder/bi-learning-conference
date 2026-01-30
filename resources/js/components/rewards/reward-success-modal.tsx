import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fireRewardConfetti } from '@/lib/confetti';
import type { Reward } from '@/types';
import { motion } from 'framer-motion';
import { Coins, Gift, PartyPopper, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-400 shadow-gray-500/50',
  rare: 'bg-blue-500/20 text-blue-400 shadow-blue-500/50',
  epic: 'bg-purple-500/20 text-purple-400 shadow-purple-500/50',
  legendary: 'bg-yellow-500/20 text-yellow-400 shadow-yellow-500/50',
};

const rarityGradients = {
  common: 'from-gray-500/20 to-gray-600/20',
  rare: 'from-blue-500/20 to-blue-600/20',
  epic: 'from-purple-500/20 to-purple-600/20',
  legendary: 'from-yellow-500/20 to-yellow-600/20',
};

interface RewardSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward;
  previousBalance: number;
  newBalance: number;
}

export function RewardSuccessModal({
  open,
  onOpenChange,
  reward,
  previousBalance,
  newBalance,
}: RewardSuccessModalProps) {
  const rarity = reward.rarity ?? 'common';

  useEffect(() => {
    if (open) {
      // Trigger confetti when modal opens
      fireRewardConfetti(rarity);
    }
  }, [open, rarity]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-linear-to-br from-green-500/20 to-emerald-500/20"
          >
            <PartyPopper className="size-10 text-green-500" />
          </motion.div>
          <DialogTitle className="text-center text-2xl">
            🎉 Reward Redeemed!
          </DialogTitle>
          <DialogDescription className="text-center">
            Congratulations! You've successfully claimed your reward.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg border bg-linear-to-br p-4 ${rarityGradients[rarity]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background/50">
                <Gift className="size-6 text-pink-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{reward.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {reward.description}
                </p>
              </div>
            </div>
            <Badge
              className={`${rarityColors[rarity]} shadow-lg`}
              variant="outline"
            >
              <Sparkles className="mr-1 size-3" />
              {rarity}
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 rounded-lg border bg-muted/50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points Spent</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <Coins className="size-4 text-yellow-500" />
              <span>{reward.cost}</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Previous Balance
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              <Coins className="size-4 text-yellow-500" />
              <span>{previousBalance}</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center"
          >
            <div className="text-2xl">→</div>
          </motion.div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Balance</span>
            <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
              <Coins className="size-5 text-yellow-500" />
              <span>{newBalance}</span>
            </div>
          </div>
        </motion.div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
