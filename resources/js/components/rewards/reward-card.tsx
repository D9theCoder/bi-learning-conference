import { RewardSuccessModal } from '@/components/rewards/reward-success-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Reward } from '@/types';
import { Form } from '@inertiajs/react';
import { Coins } from 'lucide-react';
import React from 'react';

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-yellow-500/20 text-yellow-400',
};

const rarityGlow = {
  common: 'shadow-gray-500/20',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/40',
};

interface RewardCardProps {
  reward: Reward & {
    can_redeem: boolean;
    remaining_stock?: number;
  };
  userBalance: number;
}

export function RewardCard({ reward, userBalance }: RewardCardProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);
  const [previousBalance, setPreviousBalance] = React.useState(0);
  const [newBalance, setNewBalance] = React.useState(0);
  const canRedeem = reward.can_redeem;
  const stockText =
    reward.remaining_stock !== undefined && reward.remaining_stock !== null
      ? `${reward.remaining_stock} left in stock`
      : null;

  // Calculate remaining balance after purchase (for confirmation dialog only)
  const remainingBalance = userBalance - reward.cost;

  // Use custom image if provided, otherwise use Lorem Picsum placeholder
  const imageUrl =
    reward.image_url || `https://picsum.photos/seed/${reward.id}/400/300`;

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card noPadding className="pb-6 group flex h-full flex-col transition-shadow hover:shadow-lg">
          {/* Product Image */}
          <div className="relative aspect-4/3 overflow-hidden rounded-t-lg">
            <img
              src={imageUrl}
              alt={reward.name}
              className="size-full object-cover transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                // Fallback to a gradient background if image fails to load
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.className += ` bg-gradient-to-br ${
                    reward.rarity
                      ? `from-${reward.rarity === 'common' ? 'gray' : reward.rarity === 'rare' ? 'blue' : reward.rarity === 'epic' ? 'purple' : 'yellow'}-500/20 to-${reward.rarity === 'common' ? 'gray' : reward.rarity === 'rare' ? 'blue' : reward.rarity === 'epic' ? 'purple' : 'yellow'}-600/20`
                      : 'from-gray-500/20 to-gray-600/20'
                  }`;
                }
              }}
            />
          </div>

          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{reward.name}</CardTitle>
              {reward.rarity && (
                <Badge
                  className={`${rarityColors[reward.rarity]} ${rarityGlow[reward.rarity]} shadow-lg`}
                  variant="outline"
                >
                  {reward.rarity}
                </Badge>
              )}
            </div>
            <CardDescription>{reward.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Coins className="size-5 text-yellow-500" />
              {reward.cost} points
            </div>
            {stockText && (
              <p className="text-xs text-muted-foreground">{stockText}</p>
            )}
          </CardContent>
          <CardFooter className="mt-auto">
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={!canRedeem}
                className="w-full"
                size="sm"
              >
                {canRedeem ? 'Redeem' : 'Insufficient Points'}
              </Button>
            </DialogTrigger>
          </CardFooter>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {reward.name}?</DialogTitle>
            <DialogDescription>
              Confirm your reward redemption. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Balance Information */}
          <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>
              <div className="flex items-center gap-1.5 font-semibold">
                <Coins className="size-4 text-yellow-500" />
                <span>{userBalance}</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Item Cost</span>
              <div className="flex items-center gap-1.5 font-semibold text-destructive">
                <Coins className="size-4 text-yellow-500" />
                <span>-{reward.cost}</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remaining Balance</span>
              <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                <Coins className="size-5 text-yellow-500" />
                <span>{remainingBalance}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Form
              action={`/rewards/${reward.id}/redeem`}
              method="post"
              className="w-full sm:w-auto"
              onSuccess={() => {
                // Capture balances BEFORE Inertia updates the props
                setPreviousBalance(userBalance);
                setNewBalance(userBalance - reward.cost);
                setIsDialogOpen(false);
                setIsSuccessOpen(true);
              }}
            >
              {({ processing }) => (
                <Button
                  type="submit"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={processing}
                >
                  Confirm Redeem
                </Button>
              )}
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RewardSuccessModal
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        reward={reward}
        previousBalance={previousBalance}
        newBalance={newBalance}
      />
    </>
  );
}
