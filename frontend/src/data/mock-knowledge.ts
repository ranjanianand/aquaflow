// Knowledge Base Mock Data

export type KBCategory =
  | 'equipment'
  | 'troubleshooting'
  | 'sop'
  | 'faq'
  | 'best_practices'
  | 'safety'
  | 'regulatory'
  | 'technical_bulletin';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  category: KBCategory;
  subcategory?: string;
  tags: string[];
  content: string;
  summary: string;
  visibility: 'internal' | 'customer' | 'public';
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  relatedArticles: string[];
  relatedAssetTypes: string[];
  attachments: Attachment[];
  author: string;
  reviewedBy?: string;
  publishedAt?: Date;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  lastUpdated: Date;
  createdAt: Date;
}

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'RO Membrane Cleaning Procedure',
    slug: 'ro-membrane-cleaning-procedure',
    category: 'sop',
    subcategory: 'RO Systems',
    tags: ['RO', 'Membrane', 'Cleaning', 'Maintenance'],
    content: `# RO Membrane Cleaning Procedure

## Overview
This document outlines the standard procedure for cleaning RO membranes to maintain optimal performance and extend membrane life.

## Prerequisites
- Ensure system is in standby mode
- Verify chemical inventory (citric acid, NaOH, detergent)
- Check cleaning tank level and condition
- Wear appropriate PPE (goggles, gloves, apron)

## Procedure

### Step 1: System Preparation
1. Stop the RO system and close feed valve
2. Drain permeate and concentrate lines
3. Isolate membrane vessels from main piping

### Step 2: Low pH Cleaning (Inorganic Fouling)
1. Prepare citric acid solution (2% w/v) at 35-40°C
2. Circulate through membranes for 30-60 minutes
3. Monitor pH - should remain between 2.0-2.5
4. Soak for 1-2 hours if heavily fouled

### Step 3: High pH Cleaning (Organic/Biological Fouling)
1. Prepare NaOH + detergent solution (pH 11-12) at 35-40°C
2. Circulate through membranes for 30-60 minutes
3. Monitor pH - should remain between 11.0-12.0
4. Soak for 1-2 hours if needed

### Step 4: Final Rinse
1. Flush with RO permeate until pH neutralizes
2. Check SDI of rinse water
3. Document cleaning results

## Safety Notes
- Never mix acid and alkaline solutions
- Ensure adequate ventilation
- Follow chemical handling guidelines`,
    summary: 'Standard operating procedure for cleaning RO membranes including low pH and high pH cleaning steps.',
    visibility: 'internal',
    status: 'published',
    version: 3,
    relatedArticles: ['kb-2', 'kb-5'],
    relatedAssetTypes: ['RO Membrane', 'RO System'],
    attachments: [
      { id: 'att-1', name: 'RO_Cleaning_Checklist.pdf', type: 'pdf', size: '245 KB', url: '#' },
      { id: 'att-2', name: 'Chemical_Dosing_Chart.xlsx', type: 'xlsx', size: '128 KB', url: '#' },
    ],
    author: 'Amit Singh',
    reviewedBy: 'Dr. Ramesh Kumar',
    publishedAt: new Date('2024-06-15'),
    viewCount: 1245,
    helpfulCount: 89,
    notHelpfulCount: 3,
    lastUpdated: new Date('2024-10-20'),
    createdAt: new Date('2023-03-10'),
  },
  {
    id: 'kb-2',
    title: 'Troubleshooting High TDS in RO Permeate',
    slug: 'troubleshooting-high-tds-ro-permeate',
    category: 'troubleshooting',
    subcategory: 'RO Systems',
    tags: ['RO', 'TDS', 'Troubleshooting', 'Water Quality'],
    content: `# Troubleshooting High TDS in RO Permeate

## Problem Description
TDS (Total Dissolved Solids) in RO permeate exceeds normal operating range (typically >50 ppm for single-pass RO).

## Possible Causes and Solutions

### 1. Membrane Damage or Aging
**Symptoms:**
- Gradual increase in permeate TDS
- Reduced rejection rate below 95%

**Solutions:**
- Perform membrane autopsy if available
- Check normalized salt passage
- Consider membrane replacement if > 3 years old

### 2. O-ring or Seal Failure
**Symptoms:**
- Sudden spike in TDS
- Visible leaks around pressure vessels

**Solutions:**
- Inspect all O-rings and interconnectors
- Replace damaged seals
- Use proper lubricant during reassembly

### 3. Membrane Fouling
**Symptoms:**
- Increased feed pressure
- Decreased permeate flow
- Gradual TDS increase

**Solutions:**
- Perform CIP (Clean-In-Place)
- Check antiscalant dosing
- Review SDI of feed water

### 4. Operating Conditions
**Symptoms:**
- TDS fluctuates with temperature/pressure

**Solutions:**
- Verify operating within design parameters
- Check temperature compensation
- Optimize recovery rate

## Diagnostic Checklist
- [ ] Check normalized salt passage trend
- [ ] Verify feed water quality
- [ ] Inspect vessel probing
- [ ] Review operating log for anomalies`,
    summary: 'Guide to diagnose and resolve high TDS issues in RO permeate water.',
    visibility: 'internal',
    status: 'published',
    version: 2,
    relatedArticles: ['kb-1', 'kb-3'],
    relatedAssetTypes: ['RO Membrane', 'RO System'],
    attachments: [],
    author: 'Priya Sharma',
    reviewedBy: 'Amit Singh',
    publishedAt: new Date('2024-04-20'),
    viewCount: 2341,
    helpfulCount: 156,
    notHelpfulCount: 8,
    lastUpdated: new Date('2024-09-15'),
    createdAt: new Date('2023-06-22'),
  },
  {
    id: 'kb-3',
    title: 'pH Sensor Calibration Guide',
    slug: 'ph-sensor-calibration-guide',
    category: 'equipment',
    subcategory: 'Instrumentation',
    tags: ['pH', 'Sensor', 'Calibration', 'Instrumentation'],
    content: `# pH Sensor Calibration Guide

## Calibration Frequency
- Routine: Weekly
- Critical applications: Daily
- After sensor replacement: Immediate

## Required Materials
- Buffer solutions: pH 4.01, pH 7.00, pH 10.01
- Distilled water
- Soft cloth or tissue
- Calibration log sheet

## Two-Point Calibration Procedure

### Step 1: Preparation
1. Remove sensor from process
2. Rinse thoroughly with distilled water
3. Allow sensor to stabilize at room temperature

### Step 2: Zero Point (pH 7.00)
1. Immerse sensor in pH 7.00 buffer
2. Wait for stable reading (2-3 minutes)
3. Adjust zero offset to read 7.00
4. Record reading and deviation

### Step 3: Slope Adjustment
1. Rinse sensor with distilled water
2. Immerse in pH 4.01 or 10.01 buffer
3. Wait for stable reading
4. Adjust slope to match buffer value
5. Record reading and slope percentage

### Step 4: Verification
1. Rinse and check pH 7.00 buffer again
2. Verify reading is within ±0.05 pH
3. Document calibration results

## Troubleshooting
- Slow response: Clean or replace sensor
- Won't calibrate: Check reference electrode
- Drift: Replace buffer solutions`,
    summary: 'Step-by-step guide for calibrating pH sensors including two-point calibration procedure.',
    visibility: 'customer',
    status: 'published',
    version: 4,
    relatedArticles: ['kb-4'],
    relatedAssetTypes: ['pH Sensor', 'Analyzer'],
    attachments: [
      { id: 'att-3', name: 'pH_Calibration_Video.mp4', type: 'mp4', size: '15.2 MB', url: '#' },
    ],
    author: 'Rahul Kumar',
    reviewedBy: 'Priya Sharma',
    publishedAt: new Date('2024-02-10'),
    viewCount: 3567,
    helpfulCount: 234,
    notHelpfulCount: 12,
    lastUpdated: new Date('2024-08-05'),
    createdAt: new Date('2022-11-15'),
  },
  {
    id: 'kb-4',
    title: 'Chemical Handling Safety Guidelines',
    slug: 'chemical-handling-safety-guidelines',
    category: 'safety',
    subcategory: 'Chemical Safety',
    tags: ['Safety', 'Chemicals', 'PPE', 'Handling'],
    content: `# Chemical Handling Safety Guidelines

## General Principles
- Always read SDS (Safety Data Sheet) before handling
- Use appropriate PPE at all times
- Never mix chemicals without proper knowledge
- Ensure adequate ventilation

## Common Chemicals in Water Treatment

### Sodium Hypochlorite (NaOCl)
- **Hazards:** Corrosive, oxidizer, releases chlorine gas
- **PPE:** Chemical goggles, rubber gloves, apron
- **Storage:** Cool, dark place away from acids
- **Spill Response:** Dilute with water, neutralize with sodium thiosulfate

### Sulfuric Acid (H2SO4)
- **Hazards:** Highly corrosive, generates heat when diluted
- **PPE:** Face shield, acid-resistant gloves, full body suit
- **Storage:** Separate from bases and organics
- **Spill Response:** Neutralize with soda ash, never add water to acid

### Sodium Hydroxide (NaOH)
- **Hazards:** Corrosive, generates heat when dissolved
- **PPE:** Chemical goggles, rubber gloves, face shield
- **Storage:** Keep dry, away from acids
- **Spill Response:** Neutralize with dilute acid

## Emergency Procedures
1. Eye contact: Flush with water for 15 minutes
2. Skin contact: Remove contaminated clothing, wash area
3. Inhalation: Move to fresh air, seek medical attention
4. Ingestion: Do NOT induce vomiting, call poison control`,
    summary: 'Safety guidelines for handling common water treatment chemicals including PPE requirements and emergency procedures.',
    visibility: 'public',
    status: 'published',
    version: 5,
    relatedArticles: ['kb-1'],
    relatedAssetTypes: [],
    attachments: [
      { id: 'att-4', name: 'Chemical_SDS_Collection.pdf', type: 'pdf', size: '2.4 MB', url: '#' },
      { id: 'att-5', name: 'Emergency_Response_Poster.pdf', type: 'pdf', size: '512 KB', url: '#' },
    ],
    author: 'Safety Team',
    reviewedBy: 'Dr. Ramesh Kumar',
    publishedAt: new Date('2024-01-05'),
    viewCount: 4521,
    helpfulCount: 312,
    notHelpfulCount: 5,
    lastUpdated: new Date('2024-07-20'),
    createdAt: new Date('2022-05-10'),
  },
  {
    id: 'kb-5',
    title: 'Antiscalant Dosing Best Practices',
    slug: 'antiscalant-dosing-best-practices',
    category: 'best_practices',
    subcategory: 'Chemical Dosing',
    tags: ['Antiscalant', 'Dosing', 'RO', 'Scaling', 'Best Practices'],
    content: `# Antiscalant Dosing Best Practices

## Purpose
Antiscalants prevent mineral scale formation on RO membranes, extending membrane life and maintaining efficiency.

## Dosing Calculation

### Formula
\`\`\`
Dose (ppm) = (Feed TDS × Recovery Factor) / Antiscalant Efficacy
\`\`\`

### Typical Dosing Ranges
| Water Type | Dose Range (ppm) |
|------------|------------------|
| Low TDS (<500) | 2-3 |
| Medium TDS (500-2000) | 3-5 |
| High TDS (>2000) | 5-8 |

## Best Practices

### 1. Feed Water Analysis
- Test LSI (Langelier Saturation Index) regularly
- Monitor silica, calcium, and barium levels
- Adjust dose based on seasonal variations

### 2. Dosing System Maintenance
- Calibrate dosing pump weekly
- Check for air locks in suction line
- Verify chemical tank level daily
- Clean strainers monthly

### 3. Performance Monitoring
- Track differential pressure trend
- Monitor permeate flow rate
- Log antiscalant consumption
- Review membrane autopsy results

### 4. Common Mistakes to Avoid
- Under-dosing during high recovery operation
- Using incompatible chemicals
- Ignoring temperature effects
- Skipping feed water analysis`,
    summary: 'Best practices for antiscalant dosing in RO systems including calculation methods and monitoring guidelines.',
    visibility: 'internal',
    status: 'published',
    version: 2,
    relatedArticles: ['kb-1', 'kb-2'],
    relatedAssetTypes: ['RO System', 'Dosing Pump'],
    attachments: [],
    author: 'Vikram Reddy',
    reviewedBy: 'Amit Singh',
    publishedAt: new Date('2024-05-12'),
    viewCount: 1876,
    helpfulCount: 124,
    notHelpfulCount: 6,
    lastUpdated: new Date('2024-11-01'),
    createdAt: new Date('2023-09-18'),
  },
  {
    id: 'kb-6',
    title: 'Water Quality Standards Compliance',
    slug: 'water-quality-standards-compliance',
    category: 'regulatory',
    subcategory: 'Compliance',
    tags: ['Regulatory', 'Compliance', 'Standards', 'BIS', 'WHO'],
    content: `# Water Quality Standards Compliance

## Applicable Standards

### IS 10500:2012 (BIS) - Drinking Water
| Parameter | Acceptable Limit | Permissible Limit |
|-----------|------------------|-------------------|
| pH | 6.5 - 8.5 | No relaxation |
| TDS | 500 mg/L | 2000 mg/L |
| Turbidity | 1 NTU | 5 NTU |
| Chloride | 250 mg/L | 1000 mg/L |
| Total Hardness | 200 mg/L | 600 mg/L |

### WHO Guidelines
- Refer to WHO Guidelines for Drinking-water Quality, 4th Edition
- More stringent for specific contaminants
- Includes health-based targets

## Compliance Requirements

### Monitoring Frequency
- **Online monitoring:** pH, turbidity, chlorine (continuous)
- **Daily testing:** TDS, hardness, residual chlorine
- **Weekly testing:** Bacteriological parameters
- **Monthly testing:** Full chemical analysis
- **Annual testing:** Heavy metals, pesticides

### Documentation
- Maintain lab register with all test results
- Keep calibration records for instruments
- Archive reports for minimum 5 years
- Submit periodic reports to regulatory authority`,
    summary: 'Overview of water quality standards including BIS IS 10500 and WHO guidelines with compliance requirements.',
    visibility: 'public',
    status: 'published',
    version: 3,
    relatedArticles: [],
    relatedAssetTypes: [],
    attachments: [
      { id: 'att-6', name: 'IS_10500_2012_Standard.pdf', type: 'pdf', size: '1.8 MB', url: '#' },
    ],
    author: 'Compliance Team',
    reviewedBy: 'Dr. Ramesh Kumar',
    publishedAt: new Date('2024-03-01'),
    viewCount: 2234,
    helpfulCount: 178,
    notHelpfulCount: 4,
    lastUpdated: new Date('2024-06-15'),
    createdAt: new Date('2023-01-20'),
  },
];

export const getArticleById = (id: string): KnowledgeArticle | undefined => {
  return mockKnowledgeArticles.find((article) => article.id === id);
};

export const getArticlesByCategory = (category: KBCategory): KnowledgeArticle[] => {
  return mockKnowledgeArticles.filter((article) => article.category === category);
};

export const getPublishedArticles = (): KnowledgeArticle[] => {
  return mockKnowledgeArticles.filter((article) => article.status === 'published');
};

export const searchArticles = (query: string): KnowledgeArticle[] => {
  const lowerQuery = query.toLowerCase();
  return mockKnowledgeArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getMostViewedArticles = (limit: number = 5): KnowledgeArticle[] => {
  return [...mockKnowledgeArticles]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
};

export const getCategoryLabel = (category: KBCategory): string => {
  const labels: Record<KBCategory, string> = {
    equipment: 'Equipment Manuals',
    troubleshooting: 'Troubleshooting',
    sop: 'SOPs',
    faq: 'FAQs',
    best_practices: 'Best Practices',
    safety: 'Safety Guidelines',
    regulatory: 'Regulatory',
    technical_bulletin: 'Technical Bulletins',
  };
  return labels[category];
};

export const getCategoryIcon = (category: KBCategory): string => {
  const icons: Record<KBCategory, string> = {
    equipment: 'Cpu',
    troubleshooting: 'Wrench',
    sop: 'FileText',
    faq: 'HelpCircle',
    best_practices: 'Award',
    safety: 'Shield',
    regulatory: 'Scale',
    technical_bulletin: 'Bell',
  };
  return icons[category];
};
