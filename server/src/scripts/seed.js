import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';
import { Workspace, Membership } from '../modules/workspace/workspace.model.js';
import { Feedback } from '../modules/feedback/feedback.model.js';
import { Insight } from '../modules/insights/insight.model.js';
import { createFeedbackSchema } from '../modules/feedback/feedback.validators.js';
import {
  ROLES,
  FEEDBACK_SOURCES,
  FEEDBACK_STATUS,
  AI_SENTIMENTS,
  AI_CATEGORIES,
  INSIGHT_TYPES
} from 'loop-shared';

const RAW_FEEDBACK_DATA = [
  // PERFORMANCE & BUGS
  {
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.v@acme-client.com',
    message: 'The analytics reporting dashboard takes over 12 seconds to load when filtering across 90 days. Our executive team is getting impatient.',
    source: FEEDBACK_SOURCES.SUPPORT_TICKET,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 1,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.PERFORMANCE,
      summary: 'Dashboard load latency exceeds 12 seconds on 90-day filter',
      keyPhrases: ['analytics reporting', '12 seconds latency', 'executive team'],
      confidence: 0.94
    }
  },
  {
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe.b@fintechlabs.io',
    message: 'Exporting CSV data with more than 1,000 rows consistently triggers a 504 Gateway Timeout on Chrome.',
    source: FEEDBACK_SOURCES.SUPPORT_TICKET,
    status: FEEDBACK_STATUS.IN_REVIEW,
    daysAgo: 3,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.BUG,
      summary: '504 Gateway Timeout when exporting CSV over 1,000 rows',
      keyPhrases: ['exporting CSV', '504 Gateway Timeout', '1000 rows'],
      confidence: 0.97
    }
  },
  {
    customerName: 'David Kalu',
    customerEmail: 'dkalu@zenithcorp.org',
    message: 'Encountered a bug where toggling date filters resets the custom column sorting preferences.',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 5,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.BUG,
      summary: 'Date filter toggles reset column sorting preferences',
      keyPhrases: ['date filter', 'column sorting', 'UI bug'],
      confidence: 0.91
    }
  },
  {
    customerName: 'Sarah Jenkins',
    customerEmail: 's.jenkins@cloudpeak.net',
    message: 'Mobile web responsiveness on iOS Safari is laggy when scrolling the feedback list.',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 7,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.PERFORMANCE,
      summary: 'Scrolling lag on iOS Safari mobile view',
      keyPhrases: ['iOS Safari', 'scrolling lag', 'mobile web'],
      confidence: 0.89
    }
  },
  {
    customerName: 'Liam O\'Connor',
    customerEmail: 'liam@dublintech.ie',
    message: 'Webhook payloads fail to deliver when our receiver returns a 204 No Content status code.',
    source: FEEDBACK_SOURCES.SUPPORT_TICKET,
    status: FEEDBACK_STATUS.IN_REVIEW,
    daysAgo: 9,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.BUG,
      summary: 'Webhook delivery failures on 204 No Content responses',
      keyPhrases: ['webhook delivery', '204 No Content', 'API bug'],
      confidence: 0.95
    }
  },

  // PRAISE & POSITIVE SENTIMENT
  {
    customerName: 'Elena Rostova',
    customerEmail: 'elena@growthventures.com',
    message: 'The AI feedback classification saved our customer success team over 15 hours this week alone. Incredible product!',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 2,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.PRAISE,
      summary: 'AI classification saved team 15+ hours weekly',
      keyPhrases: ['AI classification', '15 hours saved', 'customer success'],
      confidence: 0.99
    }
  },
  {
    customerName: 'Lucas Morales',
    customerEmail: 'lucas@andesretail.pe',
    message: 'Your Ask LOOP natural language Q&A is pure magic. I asked about churn drivers and got direct citations to real tickets.',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 4,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.PRAISE,
      summary: 'Ask LOOP Q&A praised for accurate grounded citations',
      keyPhrases: ['Ask LOOP', 'grounded citations', 'churn drivers'],
      confidence: 0.96
    }
  },
  {
    customerName: 'Samantha Wu',
    customerEmail: 'swu@nextgenhealth.ca',
    message: 'Clean UI and intuitive filtering. Our product managers adopted LOOP without needing any formal training sessions.',
    source: FEEDBACK_SOURCES.SALES_NOTE,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 6,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.PRAISE,
      summary: 'Clean intuitive UI enabled zero-training PM adoption',
      keyPhrases: ['clean UI', 'intuitive filtering', 'fast adoption'],
      confidence: 0.93
    }
  },
  {
    customerName: 'Vikram Patel',
    customerEmail: 'v.patel@mumbaistartups.in',
    message: 'The weekly trends chart helped us prove to engineering that support ticket volume decreased after the v2.4 hotfix.',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 8,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.PRAISE,
      summary: 'Trends chart verified support volume reduction after hotfix',
      keyPhrases: ['trends chart', 'volume decrease', 'v2.4 hotfix'],
      confidence: 0.92
    }
  },

  // FEATURE REQUESTS
  {
    customerName: 'Tanya Sterling',
    customerEmail: 'tanya@beaconmedia.com',
    message: 'Please add automated Slack or Microsoft Teams alert integrations whenever a NEGATIVE feedback item is logged.',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.IN_REVIEW,
    daysAgo: 2,
    ai: {
      sentiment: AI_SENTIMENTS.NEUTRAL,
      category: AI_CATEGORIES.FEATURE_REQUEST,
      summary: 'Request for Slack / MS Teams real-time alerts on negative feedback',
      keyPhrases: ['Slack alert', 'Microsoft Teams', 'negative feedback alerts'],
      confidence: 0.95
    }
  },
  {
    customerName: 'Arthur Dent',
    customerEmail: 'arthur@galaxyguides.co.uk',
    message: 'We really need a single sign-on (SAML/Okta) option for our 80-person enterprise compliance rollout.',
    source: FEEDBACK_SOURCES.SALES_NOTE,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 6,
    ai: {
      sentiment: AI_SENTIMENTS.NEUTRAL,
      category: AI_CATEGORIES.FEATURE_REQUEST,
      summary: 'Enterprise SSO (SAML/Okta) requested for compliance rollout',
      keyPhrases: ['single sign-on', 'SAML SSO', 'Okta integration'],
      confidence: 0.93
    }
  },
  {
    customerName: 'Nadia Cherif',
    customerEmail: 'nadia@solardrive.fr',
    message: 'Can you support scheduled email summaries of the weekly executive dashboard every Monday morning at 8am?',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 10,
    ai: {
      sentiment: AI_SENTIMENTS.NEUTRAL,
      category: AI_CATEGORIES.FEATURE_REQUEST,
      summary: 'Request for scheduled Monday morning executive email digest',
      keyPhrases: ['scheduled email', 'executive summary', 'Monday digest'],
      confidence: 0.91
    }
  },
  {
    customerName: 'George Costanza',
    customerEmail: 'george@vandelay-industries.com',
    message: 'A dark mode theme option would make late-night triage sessions significantly easier on the eyes.',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 12,
    ai: {
      sentiment: AI_SENTIMENTS.NEUTRAL,
      category: AI_CATEGORIES.FEATURE_REQUEST,
      summary: 'Dark mode theme request for night triage',
      keyPhrases: ['dark mode', 'theme option', 'night triage'],
      confidence: 0.88
    }
  },

  // PRICING & BILLING
  {
    customerName: 'Rachel Green',
    customerEmail: 'rachel@bloomingdales-corp.com',
    message: 'The jump from the Starter Tier ($49/mo) to the Growth Tier ($299/mo) is too steep for early-stage startups.',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 3,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.PRICING,
      summary: 'Tier pricing gap between Starter and Growth considered too steep',
      keyPhrases: ['pricing tier', 'Starter to Growth', 'steep jump'],
      confidence: 0.94
    }
  },
  {
    customerName: 'Chandler Bing',
    customerEmail: 'chandler@transponster.net',
    message: 'Our corporate VAT number is not showing up on monthly PDF tax invoices.',
    source: FEEDBACK_SOURCES.SUPPORT_TICKET,
    status: FEEDBACK_STATUS.IN_REVIEW,
    daysAgo: 11,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.PRICING,
      summary: 'Corporate VAT number missing from monthly PDF invoices',
      keyPhrases: ['VAT number', 'tax invoices', 'billing error'],
      confidence: 0.96
    }
  },
  {
    customerName: 'Monica Geller',
    customerEmail: 'monica@alessandros.ny',
    message: 'Annual billing discounts are very fair. We gladly locked in our subscription for the full year.',
    source: FEEDBACK_SOURCES.SALES_NOTE,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 14,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.PRICING,
      summary: 'Praise for annual billing discount structure',
      keyPhrases: ['annual discount', 'subscription lock-in', 'fair pricing'],
      confidence: 0.92
    }
  },

  // USABILITY & ONBOARDING
  {
    customerName: 'Ross Geller',
    customerEmail: 'ross@museum-naturalhistory.org',
    message: 'The date range picker on the dashboard is difficult to operate on smaller laptop displays.',
    source: FEEDBACK_SOURCES.APP_REVIEW,
    status: FEEDBACK_STATUS.NEW,
    daysAgo: 7,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.USABILITY,
      summary: 'Date picker controls cramped on small laptop screens',
      keyPhrases: ['date range picker', 'usability friction', 'laptop screen'],
      confidence: 0.90
    }
  },
  {
    customerName: 'Phoebe Buffay',
    customerEmail: 'phoebe@smellycat-music.com',
    message: 'It was confusing where to find the CSV upload template at first until support pointed it out.',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 15,
    ai: {
      sentiment: AI_SENTIMENTS.NEUTRAL,
      category: AI_CATEGORIES.USABILITY,
      summary: 'CSV upload template discoverability initial confusion',
      keyPhrases: ['CSV template', 'discoverability', 'upload tab'],
      confidence: 0.87
    }
  },

  // CUSTOMER SUPPORT
  {
    customerName: 'Benjamin Sisko',
    customerEmail: 'sisko@deepspace9.fed',
    message: 'Support engineer Jessica resolved our complex data migration ticket in less than 30 minutes. 10/10 service!',
    source: FEEDBACK_SOURCES.SURVEY,
    status: FEEDBACK_STATUS.RESOLVED,
    daysAgo: 5,
    ai: {
      sentiment: AI_SENTIMENTS.POSITIVE,
      category: AI_CATEGORIES.CUSTOMER_SUPPORT,
      summary: 'Praise for support agent solving complex migration in 30 minutes',
      keyPhrases: ['customer support', 'fast resolution', 'data migration'],
      confidence: 0.98
    }
  },
  {
    customerName: 'Jean-Luc Picard',
    customerEmail: 'picard@starfleet.org',
    message: 'Initial response time on weekend support tickets is significantly slower than weekday SLA promises.',
    source: FEEDBACK_SOURCES.SUPPORT_TICKET,
    status: FEEDBACK_STATUS.IN_REVIEW,
    daysAgo: 13,
    ai: {
      sentiment: AI_SENTIMENTS.NEGATIVE,
      category: AI_CATEGORIES.CUSTOMER_SUPPORT,
      summary: 'Weekend ticket response latency breaches expected SLA',
      keyPhrases: ['weekend response', 'SLA breach', 'support delay'],
      confidence: 0.93
    }
  }
];

// Replicate varied entries to reach ~60 high-fidelity realistic records
const generateFullFeedbackDataset = () => {
  const base = [...RAW_FEEDBACK_DATA];
  const full = [];

  const modifiers = [
    { prefix: 'Acme West', dayOffset: 0 },
    { prefix: 'Global HQ', dayOffset: 12 },
    { prefix: 'APAC Team', dayOffset: 24 }
  ];

  modifiers.forEach((mod, modIdx) => {
    base.forEach((item, itemIdx) => {
      const calculatedDaysAgo = (item.daysAgo + mod.dayOffset) % 45;
      const targetDate = new Date(Date.now() - calculatedDaysAgo * 24 * 60 * 60 * 1000);

      full.push({
        customerName: `${item.customerName} (${mod.prefix})`,
        customerEmail: item.customerEmail.replace('@', `+${modIdx}@`),
        message: `${item.message} [Branch: ${mod.prefix}]`,
        source: item.source,
        status: item.status,
        receivedAt: targetDate,
        ai: {
          ...item.ai,
          analyzedAt: targetDate,
          model: 'claude-3-5-sonnet-20241022',
          status: 'DONE'
        }
      });
    });
  });

  return full; // 20 * 3 = 60 items
};

export const seedDatabase = async () => {
  console.log('\n======================================================');
  console.log('   🚀 LOOP PLATFORM SEED SCRIPT (Stage 8)            ');
  console.log('======================================================\n');

  try {
    await connectDB();

    console.log('[Seed] Cleaning existing test/demo data...');
    const demoEmails = ['alex@acme.corp', 'sam.member@acme.corp'];
    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const userIds = existingUsers.map(u => u._id);

    const existingWorkspaces = await Workspace.find({ ownerId: { $in: userIds } });
    const workspaceIds = existingWorkspaces.map(w => w._id);

    await Promise.all([
      User.deleteMany({ email: { $in: demoEmails } }),
      Workspace.deleteMany({ _id: { $in: workspaceIds } }),
      Membership.deleteMany({ workspaceId: { $in: workspaceIds } }),
      Feedback.deleteMany({ workspaceId: { $in: workspaceIds } }),
      Insight.deleteMany({ workspaceId: { $in: workspaceIds } })
    ]);

    // 1. Create Demo Users
    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('demo123456', salt);

    const ownerUser = await User.create({
      name: 'Alex Mercer',
      email: 'alex@acme.corp',
      passwordHash
    });

    const memberUser = await User.create({
      name: 'Sam Rivera',
      email: 'sam.member@acme.corp',
      passwordHash
    });

    // 2. Create Demo Workspace
    console.log('[Seed] Provisioning workspace "Acme Intelligence"...');
    const workspace = await Workspace.create({
      name: 'Acme Intelligence',
      slug: 'acme-intelligence-demo',
      ownerId: ownerUser._id
    });

    // 3. Assign Memberships
    await Membership.create([
      {
        userId: ownerUser._id,
        workspaceId: workspace._id,
        role: ROLES.OWNER
      },
      {
        userId: memberUser._id,
        workspaceId: workspace._id,
        role: ROLES.MEMBER
      }
    ]);

    // 4. Validate and Seed 60 Feedback Records
    console.log('[Seed] Validating and inserting ~60 realistic feedback records...');
    const feedbackList = generateFullFeedbackDataset();
    const validatedDocs = [];

    for (const item of feedbackList) {
      // Validate through the real Zod submission schema (Section 8 rule)
      const parsed = createFeedbackSchema.safeParse({
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        message: item.message,
        source: item.source,
        receivedAt: item.receivedAt.toISOString()
      });

      if (!parsed.success) {
        console.warn(`[Seed Warning] Row validation failed:`, parsed.error.format());
        continue;
      }

      validatedDocs.push({
        workspaceId: workspace._id,
        createdBy: ownerUser._id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        message: item.message,
        source: item.source,
        status: item.status,
        receivedAt: item.receivedAt,
        ai: item.ai
      });
    }

    const insertedFeedback = await Feedback.insertMany(validatedDocs);
    console.log(`[Seed] Successfully inserted ${insertedFeedback.length} verified feedback items.`);

    // 5. Generate Initial Strategic Insights
    console.log('[Seed] Generating initial grounded strategic insights...');
    const sampleBugIds = insertedFeedback
      .filter(f => f.ai.category === AI_CATEGORIES.BUG || f.ai.category === AI_CATEGORIES.PERFORMANCE)
      .slice(0, 4)
      .map(f => f._id);

    const samplePraiseIds = insertedFeedback
      .filter(f => f.ai.sentiment === AI_SENTIMENTS.POSITIVE)
      .slice(0, 4)
      .map(f => f._id);

    const sampleFeatureIds = insertedFeedback
      .filter(f => f.ai.category === AI_CATEGORIES.FEATURE_REQUEST)
      .slice(0, 4)
      .map(f => f._id);

    await Insight.insertMany([
      {
        workspaceId: workspace._id,
        type: INSIGHT_TYPES.THEME,
        title: 'Reporting Dashboard Latency & CSV Timeout on Large Datasets',
        body: 'Multiple enterprise accounts report high latency exceeding 10 seconds and 504 timeouts when generating CSV reports beyond 1,000 records. Addressing backend export streaming will directly eliminate the largest source of support tickets.',
        evidence: {
          feedbackIds: sampleBugIds,
          count: sampleBugIds.length
        },
        windowDays: 30
      },
      {
        workspaceId: workspace._id,
        type: INSIGHT_TYPES.TREND,
        title: 'Surging Demand for Real-Time Slack & Teams Alert Integrations',
        body: 'Customer feedback indicates strong workflow attachment to communication tools. Support and product managers are requesting immediate push notifications when negative feedback is registered.',
        evidence: {
          feedbackIds: sampleFeatureIds,
          count: sampleFeatureIds.length
        },
        windowDays: 30
      },
      {
        workspaceId: workspace._id,
        type: INSIGHT_TYPES.RECOMMENDATION,
        title: 'Capitalize on Ask LOOP Satisfaction by Highlighting Grounded Citations in Marketing',
        body: 'Customers consistently praise the grounded Q&A capabilities. Creating video case studies demonstrating citation verification will accelerate conversion among security-conscious enterprise buyers.',
        evidence: {
          feedbackIds: samplePraiseIds,
          count: samplePraiseIds.length
        },
        windowDays: 30
      }
    ]);

    console.log('[Seed] Strategic insights created successfully.');

    // 6. Print Demo Credentials
    console.log('\n======================================================');
    console.log('   🎉 SEED COMPLETED SUCCESSFULLY!                    ');
    console.log('======================================================');
    console.log('\nYou can now log in to the demo workspace using:');
    console.log('\n👤 DEMO ACCOUNT 1 (OWNER):');
    console.log('   Email    : alex@acme.corp');
    console.log('   Password : demo123456');
    console.log('   Role     : OWNER (Full permissions & member management)');
    console.log('\n👤 DEMO ACCOUNT 2 (MEMBER):');
    console.log('   Email    : sam.member@acme.corp');
    console.log('   Password : demo123456');
    console.log('   Role     : MEMBER (Submit, review, triage, Ask LOOP)');
    console.log('\n🏢 WORKSPACE:');
    console.log(`   Name     : Acme Intelligence`);
    console.log(`   Items    : ${insertedFeedback.length} Feedback Records (spanning 45 days)`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

// Auto-run if executed directly via node
if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
