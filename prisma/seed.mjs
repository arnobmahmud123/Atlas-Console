import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@saas.local';
const ADMIN_PASSWORD = 'Admin123!';

const DEMO_PASSWORD = 'User123!';

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password_hash: passwordHash,
      role: 'ADMIN',
      updated_at: now
    },
    create: {
      id: crypto.randomUUID(),
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'ADMIN',
      updated_at: now
    }
  });

  // System wallet owned by admin for platform accounts
  const systemWallet = await prisma.wallet.upsert({
    where: {
      id: '00000000-0000-0000-0000-000000000001'
    },
    update: {
      name: 'System Wallet',
      currency: 'USD',
      updated_at: now
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: admin.id,
      name: 'System Wallet',
      currency: 'USD',
      updated_at: now
    }
  });

  // Default ledger accounts
  const ledgerAccounts = [
    { name: 'Cash', account_no: '1000' },
    { name: 'Customer Liability', account_no: '2000' },
    { name: 'Investment Holding', account_no: '3000' },
    { name: 'Revenue', account_no: '4000' },
    { name: 'Fees', account_no: '4100' }
  ];

  const systemAccounts = {};

  for (const account of ledgerAccounts) {
    const record = await prisma.ledgerAccount.upsert({
      where: { account_no: account.account_no },
      update: {
        name: account.name,
        user_id: admin.id,
        wallet_id: systemWallet.id,
        updated_at: now
      },
      create: {
        id: crypto.randomUUID(),
        name: account.name,
        account_no: account.account_no,
        user_id: admin.id,
        wallet_id: systemWallet.id,
        updated_at: now
      }
    });
    systemAccounts[account.account_no] = record;
  }

  // Demo users for non-admin roles
  const demoUsers = [
    { email: 'staff@saas.local', role: 'STAFF' },
    { email: 'accountant@saas.local', role: 'ACCOUNTANT' },
    { email: 'user@saas.local', role: 'USER' },
    { email: 'user2@saas.local', role: 'USER' }
  ];

  const demoRecords = [];

  for (const demo of demoUsers) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { role: demo.role, password_hash: hash, updated_at: now },
      create: { id: crypto.randomUUID(), email: demo.email, role: demo.role, password_hash: hash, updated_at: now }
    });
    demoRecords.push(user);
  }

  const profileMap = {
    [demoRecords[0]?.id ?? '']: {
      name: 'Ava Thompson',
      phone: '+1 (415) 555-0142',
      address: '312 Market St, San Francisco, CA'
    },
    [demoRecords[1]?.id ?? '']: {
      name: 'Noah Bennett',
      phone: '+1 (212) 555-0177',
      address: '11 Wall St, New York, NY'
    },
    [demoRecords[2]?.id ?? '']: {
      name: 'James Carter',
      phone: '+1 (646) 555-9021',
      address: '84 Hudson Ave, New York, NY'
    },
    [demoRecords[3]?.id ?? '']: {
      name: 'Maya Singh',
      phone: '+1 (212) 555-3308',
      address: '19 W 24th St, New York, NY'
    }
  };

  await prisma.siteSettings.upsert({
    where: { key: 'demo_profiles' },
    update: { value: profileMap },
    create: { id: crypto.randomUUID(), key: 'demo_profiles', value: profileMap, updated_at: now }
  });

  // Mobile banking payment instructions
  await prisma.siteSettings.upsert({
    where: { key: 'bkash_number' },
    update: { value: { number: '01700000000' }, updated_at: now },
    create: { id: crypto.randomUUID(), key: 'bkash_number', value: { number: '01700000000' }, updated_at: now }
  });
  await prisma.siteSettings.upsert({
    where: { key: 'nagad_number' },
    update: { value: { number: '01800000000' }, updated_at: now },
    create: { id: crypto.randomUUID(), key: 'nagad_number', value: { number: '01800000000' }, updated_at: now }
  });

  // Default investment plans
  const plans = [
    {
      name: 'Starter Plan',
      min_amount: new Prisma.Decimal(100),
      max_amount: new Prisma.Decimal(1000),
      roi_type: 'FIXED',
      roi_value: new Prisma.Decimal(0.01),
      duration_days: 30,
      is_active: true
    },
    {
      name: 'Growth Plan',
      min_amount: new Prisma.Decimal(1000),
      max_amount: new Prisma.Decimal(10000),
      roi_type: 'FIXED',
      roi_value: new Prisma.Decimal(0.015),
      duration_days: 60,
      is_active: true
    }
  ];

  const planRecords = [];

  for (const plan of plans) {
    const record = await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: { ...plan },
      create: { id: crypto.randomUUID(), created_at: now, ...plan }
    });
    planRecords.push(record);
  }

  // Create wallets, ledger accounts, and demo activity for users (skip staff)
  const users = demoRecords.filter(u => u.role === 'USER');

  for (const [index, user] of users.entries()) {
    const mainWallet =
      (await prisma.wallet.findFirst({ where: { user_id: user.id, name: 'Main Wallet' } })) ??
      (await prisma.wallet.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          name: 'Main Wallet',
          currency: 'USD',
          updated_at: now
        }
      }));

    const profitWallet =
      (await prisma.wallet.findFirst({ where: { user_id: user.id, name: 'Profit Wallet' } })) ??
      (await prisma.wallet.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          name: 'Profit Wallet',
          currency: 'USD',
          type: 'PROFIT',
          updated_at: now
        }
      }));

    const mainAccountNo = `U-${user.id.slice(0, 8)}-MAIN`;
    const profitAccountNo = `U-${user.id.slice(0, 8)}-PROFIT`;

    const userMainAccount = await prisma.ledgerAccount.upsert({
      where: { account_no: mainAccountNo },
      update: {
        user_id: user.id,
        wallet_id: mainWallet.id,
        name: 'User Main',
        updated_at: now
      },
      create: {
        id: crypto.randomUUID(),
        user_id: user.id,
        wallet_id: mainWallet.id,
        name: 'User Main',
        account_no: mainAccountNo,
        updated_at: now
      }
    });

    const userProfitAccount = await prisma.ledgerAccount.upsert({
      where: { account_no: profitAccountNo },
      update: {
        user_id: user.id,
        wallet_id: profitWallet.id,
        name: 'User Profit',
        updated_at: now
      },
      create: {
        id: crypto.randomUUID(),
        user_id: user.id,
        wallet_id: profitWallet.id,
        name: 'User Profit',
        account_no: profitAccountNo,
        updated_at: now
      }
    });

    // KYC
    await prisma.kyc.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        document_type: 'PASSPORT',
        document_front_url: '/demo/kyc-front.svg',
        document_back_url: '/demo/kyc-back.svg',
        selfie_url: '/demo/kyc-selfie.svg',
        status: index === 0 ? 'APPROVED' : 'PENDING',
        reviewed_by: index === 0 ? admin.id : null
      }
    });

    // Deposit -> Ledger entries
    const depositAmounts = [500 + index * 250, 350 + index * 100, 900 + index * 150].map(a => new Prisma.Decimal(a));
    for (const amount of depositAmounts) {
      const deposit = await prisma.deposit.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          amount,
          payment_method: 'MANUAL',
          status: 'SUCCESS',
          updated_at: now
        }
      });

      const depositTx = await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          wallet_id: mainWallet.id,
          currency: 'USD',
          type: 'DEPOSIT',
          amount,
          status: 'SUCCESS',
          updated_at: now
        }
      });

      await prisma.ledgerEntry.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            wallet_id: mainWallet.id,
            ledger_account_id: userMainAccount.id,
            transaction_id: depositTx.id,
            amount,
            direction: 'DEBIT',
            updated_at: now
          },
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            wallet_id: systemWallet.id,
            ledger_account_id: systemAccounts['2000'].id,
            transaction_id: depositTx.id,
            amount,
            direction: 'CREDIT',
            updated_at: now
          }
        ]
      });
    }

    // Investment position
    const plan = planRecords[index % planRecords.length];
    const position = await prisma.investmentPosition.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        plan_id: plan.id,
        invested_amount: new Prisma.Decimal(200 + index * 100),
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        total_profit_paid: new Prisma.Decimal(0)
      }
    });

    const investTx = await prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        wallet_id: mainWallet.id,
        currency: 'USD',
        type: 'INVESTMENT',
        amount: position.invested_amount,
        status: 'SUCCESS',
        updated_at: now
      }
    });

    await prisma.ledgerEntry.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          wallet_id: systemWallet.id,
          ledger_account_id: systemAccounts['3000'].id,
          transaction_id: investTx.id,
          amount: position.invested_amount,
          direction: 'DEBIT',
          updated_at: now
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          wallet_id: mainWallet.id,
          ledger_account_id: userMainAccount.id,
          transaction_id: investTx.id,
          amount: position.invested_amount,
          direction: 'CREDIT',
          updated_at: now
        }
      ]
    });

    // Reward payout
    const rewardAmounts = [25 + index * 5, 30 + index * 6, 18 + index * 4].map(a => new Prisma.Decimal(a));
    for (const amount of rewardAmounts) {
      const rewardTx = await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          wallet_id: mainWallet.id,
          currency: 'USD',
          type: 'DIVIDEND',
          amount,
          status: 'SUCCESS',
          updated_at: now
        }
      });

      await prisma.ledgerEntry.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            wallet_id: mainWallet.id,
            ledger_account_id: userMainAccount.id,
            transaction_id: rewardTx.id,
            amount,
            direction: 'DEBIT',
            updated_at: now
          },
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            wallet_id: systemWallet.id,
            ledger_account_id: systemAccounts['4000'].id,
            transaction_id: rewardTx.id,
            amount,
            direction: 'CREDIT',
            updated_at: now
          }
        ]
      });
    }

    // Withdrawal (only for first user)
    if (index === 0) {
      const withdrawalAmounts = [100, 75].map(a => new Prisma.Decimal(a));
      for (const amount of withdrawalAmounts) {
        const withdrawal = await prisma.withdrawal.create({
          data: {
            id: crypto.randomUUID(),
            user_id: user.id,
            amount,
            withdraw_method: 'BANK',
            status: 'PAID',
            reviewed_by: admin.id,
            updated_at: now
          }
        });

        const withdrawalTx = await prisma.transaction.create({
          data: {
            id: crypto.randomUUID(),
            user_id: user.id,
            wallet_id: mainWallet.id,
            currency: 'USD',
            type: 'WITHDRAWAL',
            amount,
            status: 'SUCCESS',
            updated_at: now
          }
        });

        await prisma.ledgerEntry.createMany({
          data: [
            {
              id: crypto.randomUUID(),
              user_id: user.id,
              wallet_id: systemWallet.id,
              ledger_account_id: systemAccounts['2000'].id,
              transaction_id: withdrawalTx.id,
              amount,
              direction: 'DEBIT',
              updated_at: now
            },
            {
              id: crypto.randomUUID(),
              user_id: user.id,
              wallet_id: mainWallet.id,
              ledger_account_id: userMainAccount.id,
              transaction_id: withdrawalTx.id,
              amount,
              direction: 'CREDIT',
              updated_at: now
            }
          ]
        });
      }
    }

    // Notification
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        type: 'INFO',
        title: 'Welcome to the platform',
        message: 'Your account is ready. Explore investment plans and wallet tools.'
      }
    });
  }

  // Referral link between user1 and user2
  if (users.length >= 2) {
    await prisma.referral.create({
      data: {
        id: crypto.randomUUID(),
        user_id: users[1].id,
        parent_user_id: users[0].id,
        level: 1,
        path: `${users[0].id}/${users[1].id}`
      }
    });
  }

  // Normalize wallet types for demo accounts
  await prisma.wallet.updateMany({
    where: { name: 'Profit Wallet' },
    data: { type: 'PROFIT', updated_at: now }
  });
  await prisma.wallet.updateMany({
    where: { name: 'Main Wallet' },
    data: { type: 'MAIN', updated_at: now }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
