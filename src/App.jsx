import { useMemo, useState, useRef, useEffect } from 'react'
import firms from './data/nyc_firms.json'
import './App.css'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

const FUNDING_ROUNDS = [
  {
    id: 'pre-seed',
    title: 'Pre-Seed',
    description: 'The team shapes its first prototype, hunts for proof-of-learning, and invites close angels or accelerators to keep the lights on.',
    conditions: 'Founding team, prototype/MVP, early traction signals',
    purpose: 'Validate core concept and build initial product-market fit',
    explanation: 'Pre-Seed funding is the earliest stage of venture capital, typically ranging from $10K to $500K. At this stage, founders are validating their core idea, building an MVP, and seeking initial market validation. Investors are primarily angels, accelerators, and early-stage funds who are betting on the team and the concept rather than proven traction. This round helps founders move from idea to a working prototype and gather initial user feedback.',
  },
  {
    id: 'series-a',
    title: 'Series A',
    description: 'Product-market fit needs to look repeatable, so capital fuels go-to-market leaders, instrumentation, and the first growth experiments.',
    conditions: 'Product-market fit, traction metrics, repeatable growth',
    purpose: 'Scale go-to-market operations and establish growth engine',
    explanation: 'Series A funding typically ranges from $2M to $15M and marks the transition from early-stage to growth-stage. Companies at this stage have demonstrated product-market fit with consistent user growth and revenue. The capital is used to scale the team, particularly in sales and marketing, build out infrastructure, and expand into new markets. Investors look for strong unit economics, a clear path to profitability, and a scalable business model.',
  },
  {
    id: 'series-c',
    title: 'Series C',
    description: 'Expansion capital scales hiring, international coverage, and infrastructure so the business can be audited in real time.',
    conditions: 'EBITDA positive, governance and audits, operational metrics',
    purpose: 'Expand globally and prepare for IPO readiness',
    explanation: 'Series C and later rounds typically involve $20M to $100M+ in funding. Companies at this stage are well-established with strong revenue, often profitable or near-profitable. The focus shifts to aggressive expansion—entering new geographic markets, acquiring competitors, or developing new product lines. Investors include growth equity funds, private equity firms, and strategic investors. This stage prepares companies for potential IPO or acquisition by establishing strong governance, financial controls, and operational excellence.',
  },
  {
    id: 'ipo',
    title: 'IPO',
    description: 'Bankers finalize the S-1, leadership rehearses the roadshow story, and governance, compliance, and metrics get battle-tested.',
    conditions: 'SEC filings, GAAP audits, governance, audited S-1',
    purpose: 'Go public and provide liquidity to early investors',
    explanation: 'An Initial Public Offering (IPO) is the process of offering shares of a private corporation to the public for the first time. This typically requires companies to have strong financials, consistent growth, and robust governance structures. Investment banks underwrite the offering, helping set the initial share price and facilitating the sale. The IPO process involves extensive regulatory filings (S-1), roadshows to attract institutional investors, and meeting SEC requirements. Going public provides liquidity to early investors and employees while raising capital for further growth.',
  },
  {
    id: 'post-ipo',
    title: 'Post-IPO',
    description: 'Investor relations and operational rigor keep public investors confident while the company invests in durable moats.',
    conditions: 'Listed shares, index/mandate fit, adequate liquidity',
    purpose: 'Maintain public market confidence and build long-term value',
    explanation: 'Post-IPO companies operate in the public markets, subject to quarterly earnings reports, SEC regulations, and shareholder scrutiny. Asset managers, pension funds, and index funds become major shareholders. Companies must maintain strong investor relations, deliver consistent financial performance, and communicate strategy clearly. The focus shifts to building sustainable competitive advantages, maintaining growth while managing profitability, and potentially pursuing strategic acquisitions. Public companies have access to additional capital through secondary offerings and can use stock as currency for acquisitions.',
  },
]

const buildImageUrl = (path = '') => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

// Portfolio companies for VC and PE firms
const PORTFOLIO_COMPANIES = {
  'Union Square Ventures': [
    { name: 'Twitter', url: 'https://twitter.com' },
    { name: 'Etsy', url: 'https://etsy.com' },
    { name: 'Tumblr', url: 'https://tumblr.com' },
    { name: 'Kickstarter', url: 'https://kickstarter.com' },
    { name: 'Coinbase', url: 'https://coinbase.com' },
  ],
  'Lerer Hippeau': [
    { name: 'BuzzFeed', url: 'https://buzzfeed.com' },
    { name: 'Warby Parker', url: 'https://warbyparker.com' },
    { name: 'Casper', url: 'https://casper.com' },
    { name: 'Giphy', url: 'https://giphy.com' },
    { name: 'Axios', url: 'https://axios.com' },
  ],
  'Insight Partners': [
    { name: 'Shopify', url: 'https://shopify.com' },
    { name: 'Twitter', url: 'https://twitter.com' },
    { name: 'Alibaba', url: 'https://alibaba.com' },
    { name: 'Wix', url: 'https://wix.com' },
    { name: 'Qualtrics', url: 'https://qualtrics.com' },
  ],
  'Greycroft': [
    { name: 'Venmo', url: 'https://venmo.com' },
    { name: 'Bumble', url: 'https://bumble.com' },
    { name: 'The RealReal', url: 'https://therealreal.com' },
    { name: 'Goop', url: 'https://goop.com' },
    { name: 'Maker Studios', url: 'https://makerstudios.com' },
  ],
  'Bessemer Venture Partners': [
    { name: 'LinkedIn', url: 'https://linkedin.com' },
    { name: 'Pinterest', url: 'https://pinterest.com' },
    { name: 'Shopify', url: 'https://shopify.com' },
    { name: 'Twilio', url: 'https://twilio.com' },
    { name: 'Yelp', url: 'https://yelp.com' },
  ],
  'Thrive Capital': [
    { name: 'Instagram', url: 'https://instagram.com' },
    { name: 'Warby Parker', url: 'https://warbyparker.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Slack', url: 'https://slack.com' },
    { name: 'Stripe', url: 'https://stripe.com' },
  ],
  'First Round Capital (NY)': [
    { name: 'Uber', url: 'https://uber.com' },
    { name: 'Square', url: 'https://square.com' },
    { name: 'Roblox', url: 'https://roblox.com' },
    { name: 'Notion', url: 'https://notion.so' },
    { name: 'Looker', url: 'https://looker.com' },
  ],
  'RRE Ventures': [
    { name: 'Giphy', url: 'https://giphy.com' },
    { name: 'Business Insider', url: 'https://businessinsider.com' },
    { name: 'Venmo', url: 'https://venmo.com' },
    { name: 'MakerBot', url: 'https://makerbot.com' },
    { name: 'Chartbeat', url: 'https://chartbeat.com' },
  ],
  'Primary Venture Partners': [
    { name: 'Peloton', url: 'https://onepeloton.com' },
    { name: 'Blue Apron', url: 'https://blueapron.com' },
    { name: 'Warby Parker', url: 'https://warbyparker.com' },
    { name: 'Harry\'s', url: 'https://harrys.com' },
    { name: 'Oscar Health', url: 'https://hioscar.com' },
  ],
  'Lux Capital (NY)': [
    { name: 'Anduril', url: 'https://anduril.com' },
    { name: 'Desktop Metal', url: 'https://desktopmetal.com' },
    { name: 'Eikon Therapeutics', url: 'https://eikontx.com' },
    { name: 'Verve Therapeutics', url: 'https://vervetx.com' },
    { name: 'Mythic', url: 'https://mythic-ai.com' },
  ],
  'Tiger Global Management (VC)': [
    { name: 'Stripe', url: 'https://stripe.com' },
    { name: 'Coinbase', url: 'https://coinbase.com' },
    { name: 'Databricks', url: 'https://databricks.com' },
    { name: 'Roblox', url: 'https://roblox.com' },
    { name: 'JD.com', url: 'https://jd.com' },
  ],
  'Coatue Management (Venture)': [
    { name: 'Snapchat', url: 'https://snapchat.com' },
    { name: 'Instacart', url: 'https://instacart.com' },
    { name: 'DoorDash', url: 'https://doordash.com' },
    { name: 'Databricks', url: 'https://databricks.com' },
    { name: 'Airtable', url: 'https://airtable.com' },
  ],
  'Blackstone': [
    { name: 'Hilton Worldwide', url: 'https://hilton.com' },
    { name: 'Refinitiv', url: 'https://refinitiv.com' },
    { name: 'Ancestry', url: 'https://ancestry.com' },
    { name: 'Bumble', url: 'https://bumble.com' },
    { name: 'Alight Solutions', url: 'https://alight.com' },
  ],
  'KKR & Co.': [
    { name: 'First Data', url: 'https://firstdata.com' },
    { name: 'GoDaddy', url: 'https://godaddy.com' },
    { name: 'Nielsen', url: 'https://nielsen.com' },
    { name: 'Academy Sports', url: 'https://academy.com' },
    { name: 'RB Media', url: 'https://rbmedia.com' },
  ],
  'Apollo Global Management': [
    { name: 'ADT', url: 'https://adt.com' },
    { name: 'Rackspace', url: 'https://rackspace.com' },
    { name: 'Shutterfly', url: 'https://shutterfly.com' },
    { name: 'Smart & Final', url: 'https://smartandfinal.com' },
    { name: 'Versace', url: 'https://versace.com' },
  ],
  'Warburg Pincus': [
    { name: 'Bausch Health', url: 'https://bauschhealth.com' },
    { name: 'Neiman Marcus', url: 'https://neimanmarcus.com' },
    { name: 'Zalando', url: 'https://zalando.com' },
    { name: 'Ant Financial', url: 'https://antgroup.com' },
    { name: 'Aramark', url: 'https://aramark.com' },
  ],
  'Clayton Dubilier & Rice (CD&R)': [
    { name: 'Hertz', url: 'https://hertz.com' },
    { name: 'Sally Beauty', url: 'https://sallybeauty.com' },
    { name: 'Core-Mark', url: 'https://core-mark.com' },
    { name: 'TransUnion', url: 'https://transunion.com' },
    { name: 'VWR', url: 'https://vwr.com' },
  ],
  'General Atlantic': [
    { name: 'Airbnb', url: 'https://airbnb.com' },
    { name: 'Uber', url: 'https://uber.com' },
    { name: 'Box', url: 'https://box.com' },
    { name: 'Alibaba', url: 'https://alibaba.com' },
    { name: 'Facebook', url: 'https://facebook.com' },
  ],
  'Fortress Investment Group': [
    { name: 'OneMain Financial', url: 'https://onemainfinancial.com' },
    { name: 'Aircastle', url: 'https://aircastle.com' },
    { name: 'New Residential', url: 'https://newresi.com' },
    { name: 'Springleaf', url: 'https://springleaf.com' },
    { name: 'Nationstar', url: 'https://nationstar.com' },
  ],
  'Centerbridge Partners': [
    { name: 'Albertsons', url: 'https://albertsons.com' },
    { name: 'Toshiba Memory', url: 'https://toshiba-memory.com' },
    { name: 'NXP Semiconductors', url: 'https://nxp.com' },
    { name: 'Aramark', url: 'https://aramark.com' },
    { name: 'Travelport', url: 'https://travelport.com' },
  ],
  'Silver Lake Partners (NY)': [
    { name: 'Dell Technologies', url: 'https://dell.com' },
    { name: 'Alibaba', url: 'https://alibaba.com' },
    { name: 'Skype', url: 'https://skype.com' },
    { name: 'Expedia', url: 'https://expedia.com' },
    { name: 'Motorola Solutions', url: 'https://motorolasolutions.com' },
  ],
  'Cerberus Capital Management': [
    { name: 'Albertsons', url: 'https://albertsons.com' },
    { name: 'Avon', url: 'https://avon.com' },
    { name: 'Steward Health Care', url: 'https://steward.org' },
    { name: 'Chrysler', url: 'https://chrysler.com' },
    { name: 'GMAC', url: 'https://gmac.com' },
  ],
  'Techstars NYC': [
    { name: 'SendGrid', url: 'https://sendgrid.com' },
    { name: 'ClassPass', url: 'https://classpass.com' },
    { name: 'DigitalOcean', url: 'https://digitalocean.com' },
    { name: 'Sphero', url: 'https://sphero.com' },
    { name: 'Zipline', url: 'https://flyzipline.com' },
  ],
  'ERA (Entrepreneurs Roundtable Accelerator)': [
    { name: 'PillPack', url: 'https://pillpack.com' },
    { name: 'Movable Ink', url: 'https://movableink.com' },
    { name: 'Canvas', url: 'https://canvas.com' },
    { name: 'Thinkful', url: 'https://thinkful.com' },
    { name: 'Hinge', url: 'https://hinge.co' },
  ],
  'New York Angels': [
    { name: 'Etsy', url: 'https://etsy.com' },
    { name: 'Gilt Groupe', url: 'https://gilt.com' },
    { name: 'Tumblr', url: 'https://tumblr.com' },
    { name: 'Foursquare', url: 'https://foursquare.com' },
    { name: 'Meetup', url: 'https://meetup.com' },
  ],
  'BoxGroup': [
    { name: 'Coinbase', url: 'https://coinbase.com' },
    { name: 'Pinterest', url: 'https://pinterest.com' },
    { name: 'Warby Parker', url: 'https://warbyparker.com' },
    { name: 'Blue Apron', url: 'https://blueapron.com' },
    { name: 'Harry\'s', url: 'https://harrys.com' },
  ],
  'Antler NYC': [
    { name: 'Xailient', url: 'https://xailient.com' },
    { name: 'Sampingan', url: 'https://sampingan.com' },
    { name: 'Grain', url: 'https://grain.co' },
    { name: 'Fleek', url: 'https://fleek.co' },
    { name: 'Omni', url: 'https://beomni.com' },
  ],
  'Dorm Room Fund (NYC)': [
    { name: 'Giphy', url: 'https://giphy.com' },
    { name: 'WayUp', url: 'https://wayup.com' },
    { name: 'Campus Job', url: 'https://campusjob.com' },
    { name: 'HackHands', url: 'https://hackhands.com' },
    { name: 'PillPack', url: 'https://pillpack.com' },
  ],
  'Gaingels': [
    { name: 'Brex', url: 'https://brex.com' },
    { name: 'Lambda School', url: 'https://lambdaschool.com' },
    { name: 'Out in Tech', url: 'https://outintech.com' },
    { name: 'Airtable', url: 'https://airtable.com' },
    { name: 'Notion', url: 'https://notion.so' },
  ],
}

const generateDescription = (firm) => {
  const firmName = firm.firm_name || ''
  const category = firm.category || ''
  const sectorFocus = firm.sector_focus || 'general'
  const typicalCheck = firm.typical_check_size || ''
  const focusStage = firm.focus_stage || ''
  
  // Generate detailed descriptions based on firm characteristics
  if (category === 'VC') {
    if (firmName === 'Union Square Ventures') {
      return 'Union Square Ventures is a leading early-stage venture capital firm known for backing network effects businesses and platform companies. They specialize in technology investments, particularly in consumer internet, enterprise software, and fintech. USV is recognized for their thesis-driven approach and has built a reputation for identifying transformative companies at the seed and Series A stages. The firm is known for their hands-on support and deep understanding of network effects businesses.'
    } else if (firmName === 'Lerer Hippeau') {
      return 'Lerer Hippeau is a prominent seed and early-stage venture capital firm with deep roots in the New York startup ecosystem. They excel at consumer and media investments, having backed numerous successful consumer brands and digital media companies. The firm is known for their strong network in the media and advertising industries, founder-friendly approach, and ability to help companies scale from seed to growth stage.'
    } else if (firmName === 'Insight Partners') {
      return 'Insight Partners is one of the largest and most successful growth-stage venture capital firms, specializing in software and technology investments. They are known for their scale-up methodology, providing both capital and operational expertise to help companies accelerate growth. Insight has a strong track record of backing B2B software companies and helping them scale from $10M to $100M+ in revenue.'
    } else if (firmName === 'Greycroft') {
      return 'Greycroft is a leading venture capital firm with a strong focus on consumer and enterprise technology investments. They have built a reputation for backing successful consumer brands and digital media companies, particularly in the New York and Los Angeles markets. The firm is known for their deep industry connections, especially in media and advertising, and their ability to help consumer companies achieve product-market fit and scale.'
    } else if (firmName === 'Bessemer Venture Partners') {
      return 'Bessemer Venture Partners is one of the oldest and most established venture capital firms, with a strong track record of backing technology companies from seed to IPO. They are known for their deep sector expertise, particularly in cloud infrastructure, enterprise software, and consumer internet. BVP has a reputation for being patient, long-term investors who provide strategic guidance and operational support to portfolio companies.'
    } else if (firmName === 'Thrive Capital') {
      return 'Thrive Capital is a leading venture capital firm known for their early investments in some of the most successful technology companies. They specialize in consumer internet, fintech, and enterprise software investments, with a particular strength in identifying and backing category-defining companies. The firm is recognized for their deep understanding of consumer behavior and their ability to help companies achieve rapid growth.'
    } else if (firmName === 'First Round Capital (NY)') {
      return 'First Round Capital is a seed-stage venture capital firm known for their community-driven approach and extensive founder network. They specialize in backing exceptional founders at the earliest stages, providing not just capital but also access to their platform of resources, mentorship, and connections. First Round is recognized for their hands-on support, particularly in product development and go-to-market strategy.'
    } else if (firmName === 'RRE Ventures') {
      return 'RRE Ventures is a technology-focused venture capital firm with a strong track record of backing enterprise software and fintech companies. They are known for their deep technical expertise and their ability to identify and support companies building infrastructure and platforms. The firm has a reputation for being founder-friendly and providing strategic guidance on product development and market expansion.'
    } else if (firmName === 'Primary Venture Partners') {
      return 'Primary Venture Partners is a seed and early-stage venture capital firm focused on backing exceptional founders in the New York ecosystem. They specialize in B2B software, fintech, and consumer technology investments. The firm is known for their hands-on approach, providing operational support and strategic guidance to help companies achieve product-market fit and scale efficiently.'
    } else if (firmName === 'Lux Capital (NY)') {
      return 'Lux Capital is a venture capital firm specializing in science and technology investments, particularly in deep tech, biotech, and frontier technologies. They are known for backing companies that combine scientific innovation with commercial potential. The firm has a reputation for their deep technical expertise and their ability to support companies through long development cycles.'
    } else if (firmName === 'Tiger Global Management (VC)') {
      return 'Tiger Global is a leading growth-stage investment firm known for their data-driven approach and rapid deployment of capital. They specialize in technology investments across consumer internet, enterprise software, and fintech. The firm is recognized for their ability to identify high-growth companies and provide significant capital to help them scale quickly, often leading large rounds at premium valuations.'
    } else if (firmName === 'Coatue Management (Venture)') {
      return 'Coatue is a technology-focused investment firm known for their deep research capabilities and growth-stage investments. They specialize in backing high-growth technology companies, particularly in software, consumer internet, and fintech. The firm is recognized for their analytical approach, extensive network, and ability to provide both capital and strategic insights to help companies scale.'
    }
    return `${firmName} is a leading venture capital firm specializing in ${sectorFocus.toLowerCase()} investments at the ${focusStage.toLowerCase()} stage. They provide strategic guidance and growth capital to help companies scale from early traction to market leadership. Known for their ${typicalCheck ? `typical check sizes of ${typicalCheck}` : 'flexible investment approach'} and deep sector expertise.`
  } else if (category === 'PE') {
    if (firmName === 'Blackstone') {
      return 'Blackstone is one of the world\'s largest alternative asset managers and private equity firms, known for their scale, operational expertise, and global reach. They specialize in large-cap buyouts, growth equity, and real estate investments across multiple sectors. Blackstone is recognized for their ability to transform companies through operational improvements, strategic acquisitions, and market expansion, often preparing portfolio companies for successful exits or IPOs.'
    } else if (firmName === 'KKR & Co.') {
      return 'KKR is a leading global investment firm with a strong track record in private equity, growth equity, and infrastructure investments. They are known for their operational expertise, global network, and ability to execute complex transactions. KKR specializes in large-cap buyouts and has a reputation for creating value through operational improvements, strategic initiatives, and market expansion across diverse industries.'
    } else if (firmName === 'Apollo Global Management') {
      return 'Apollo Global Management is a leading alternative asset manager specializing in private equity, credit, and real estate investments. They are known for their value-oriented approach, often investing in complex situations and distressed assets. Apollo has a strong track record of operational improvements and strategic transformations, with expertise across multiple sectors including financial services, technology, and consumer.'
    } else if (firmName === 'Warburg Pincus') {
      return 'Warburg Pincus is a leading global private equity firm known for their growth-oriented investment strategy and sector expertise. They specialize in growth equity and buyout investments across technology, healthcare, financial services, and consumer sectors. The firm is recognized for their long-term partnership approach, operational support, and ability to help companies scale globally and prepare for successful exits.'
    } else if (firmName === 'Clayton Dubilier & Rice (CD&R)') {
      return 'CD&R is a private equity firm specializing in operational value creation through strategic improvements and market expansion. They focus on middle-market and large-cap buyouts across industrial, healthcare, and consumer sectors. The firm is known for their operational expertise, hands-on approach to portfolio company management, and track record of building market-leading companies through organic growth and strategic acquisitions.'
    } else if (firmName === 'General Atlantic') {
      return 'General Atlantic is a leading growth equity firm specializing in backing high-growth companies in technology, consumer, financial services, and healthcare sectors. They are known for their global reach, sector expertise, and ability to help companies scale internationally. The firm has a strong track record of backing category leaders and helping them achieve market leadership through strategic guidance and operational support.'
    } else if (firmName === 'Fortress Investment Group') {
      return 'Fortress Investment Group is an alternative asset manager specializing in credit, private equity, and real estate investments. They are known for their expertise in complex situations, distressed assets, and credit investments. The firm has a strong track record of value creation through operational improvements, strategic restructuring, and market positioning across diverse sectors.'
    } else if (firmName === 'Centerbridge Partners') {
      return 'Centerbridge Partners is a private investment firm specializing in private equity and credit investments. They focus on middle-market and large-cap companies, often in complex or special situations. The firm is known for their operational expertise, strategic thinking, and ability to create value through operational improvements, market expansion, and strategic initiatives.'
    } else if (firmName === 'Silver Lake Partners (NY)') {
      return 'Silver Lake is a leading technology-focused private equity firm specializing in large-cap technology investments. They are known for their deep technology expertise, operational capabilities, and ability to help technology companies scale and transform. The firm has a strong track record of backing market-leading technology companies and helping them achieve strategic objectives through operational improvements and market expansion.'
    } else if (firmName === 'Cerberus Capital Management') {
      return 'Cerberus Capital Management is a private equity firm specializing in distressed investments, turnarounds, and special situations. They are known for their expertise in complex situations and their ability to create value through operational improvements and strategic restructuring. The firm focuses on middle-market and large-cap companies across diverse sectors, often investing in companies facing operational or financial challenges.'
    }
    return `${firmName} is a leading private equity firm specializing in ${sectorFocus.toLowerCase()} investments. They focus on growth equity and late-stage investments, providing capital and operational expertise to help companies scale operations, expand globally, and prepare for successful exits. Known for their ${typicalCheck ? `investment range of ${typicalCheck}` : 'strategic investment approach'} and strong track record of value creation.`
  } else if (category === 'Angel') {
    if (firmName === 'Techstars NYC') {
      return 'Techstars NYC is one of the most prestigious startup accelerators globally, providing intensive mentorship, seed funding, and access to a vast network of entrepreneurs, investors, and corporate partners. The program offers a three-month accelerator experience that helps early-stage startups refine their product, validate their business model, and prepare for seed funding. Techstars is known for their hands-on mentorship approach, connecting founders with industry experts, successful entrepreneurs, and potential customers. The accelerator has a strong track record of helping companies achieve product-market fit and raise follow-on funding from top-tier investors.'
    } else if (firmName === 'ERA (Entrepreneurs Roundtable Accelerator)') {
      return 'ERA (Entrepreneurs Roundtable Accelerator) is a leading New York-based accelerator that provides seed funding, mentorship, and office space to early-stage technology startups. The program focuses on helping founders build scalable businesses through intensive mentorship from successful entrepreneurs and investors. ERA is known for their strong network in the New York tech ecosystem and their ability to connect startups with potential customers, partners, and investors. The accelerator has a reputation for supporting diverse founders and helping companies achieve initial traction and prepare for Series A funding.'
    } else if (firmName === 'New York Angels') {
      return 'New York Angels is one of the largest and most active angel investor groups in New York, consisting of experienced entrepreneurs, executives, and investors who provide capital and mentorship to early-stage startups. The group focuses on technology, healthcare, and consumer companies, offering both individual and syndicated investments. New York Angels is known for their rigorous due diligence process, hands-on mentorship approach, and extensive network of industry connections. They have a strong track record of helping startups navigate the early stages of growth and connect with follow-on investors.'
    } else if (firmName === 'BoxGroup') {
      return 'BoxGroup is a seed-stage investment firm known for their early investments in some of the most successful technology companies. They specialize in backing exceptional founders at the earliest stages, often before product-market fit is established. BoxGroup is recognized for their founder-friendly approach, providing not just capital but also strategic guidance, introductions to key partners, and support in building initial teams. The firm has a strong reputation for identifying promising startups and helping them achieve early traction and prepare for institutional funding rounds.'
    } else if (firmName === 'Antler NYC') {
      return 'Antler NYC is a global startup generator and early-stage VC firm that helps exceptional people build companies from the ground up. The program brings together ambitious individuals, helps them find co-founders, validate ideas, and provides initial funding to launch their startups. Antler is known for their unique approach of building companies from scratch, focusing on identifying talented individuals and helping them form strong founding teams. The firm has a strong track record of creating successful companies across various sectors, particularly in technology and fintech, and provides ongoing support through their global network of entrepreneurs and investors.'
    } else if (firmName === 'Dorm Room Fund (NYC)') {
      return 'Dorm Room Fund (NYC) is a student-run venture capital fund that invests in student-founded startups. The fund is backed by First Round Capital and provides seed funding, mentorship, and access to a network of successful entrepreneurs and investors. Dorm Room Fund is unique in that it is entirely run by students, giving them deep insight into the challenges and opportunities facing student entrepreneurs. The fund is known for their founder-friendly approach, quick decision-making process, and ability to help student startups navigate the transition from campus to the broader startup ecosystem.'
    } else if (firmName === 'Gaingels') {
      return 'Gaingels is the largest network of LGBTQ+ and ally investors, providing capital and mentorship to startups with diverse leadership teams. The fund focuses on early-stage investments across technology, healthcare, and consumer sectors, with a particular emphasis on supporting underrepresented founders. Gaingels is known for their commitment to diversity and inclusion, providing not just capital but also access to a vast network of LGBTQ+ entrepreneurs, executives, and investors. The fund has a strong track record of helping diverse startups achieve growth and connect with follow-on investors who value inclusive leadership teams.'
    }
    return `${firmName} is an early-stage investor providing mentorship and capital for founders building their first prototype. They focus on ${sectorFocus.toLowerCase()} startups at the ${focusStage.toLowerCase()} stage, offering ${typicalCheck ? `typical investments of ${typicalCheck}` : 'flexible investment terms'} and hands-on support to help founders validate their concept and achieve initial traction.`
  } else if (category === 'Investment Bank') {
    if (firmName === 'Goldman Sachs') {
      return 'Goldman Sachs is one of the world\'s leading investment banks and financial services firms, renowned for their expertise in IPOs, M&A advisory, and capital markets. They are consistently ranked among the top underwriters for technology and healthcare IPOs, known for their extensive institutional investor network and ability to price offerings optimally. The firm has a strong track record of leading high-profile public offerings and providing strategic guidance to companies throughout the IPO process, from S-1 filing to post-IPO support.'
    } else if (firmName === 'Morgan Stanley') {
      return 'Morgan Stanley is a premier global investment bank with exceptional strength in equity capital markets and IPO underwriting. They are particularly recognized for their expertise in technology, healthcare, and consumer IPOs, with a deep understanding of institutional investor preferences. The firm is known for their sophisticated pricing strategies, comprehensive roadshow execution, and ability to help companies navigate complex regulatory requirements while maximizing valuation and ensuring successful market debuts.'
    } else if (firmName === 'J.P. Morgan') {
      return 'J.P. Morgan is one of the largest and most influential investment banks globally, with unparalleled capabilities across equity and debt capital markets. They excel at executing large-scale IPOs and have a strong reputation for their comprehensive approach to public offerings, combining deep sector expertise with extensive global distribution. The firm is known for their ability to handle complex transactions, provide strategic M&A advisory, and support companies through all stages of the public markets journey.'
    } else if (firmName === 'Bank of America') {
      return 'Bank of America is a major global investment bank with strong capabilities in equity capital markets and IPO underwriting. They have built a reputation for their broad sector coverage and ability to execute offerings across diverse industries. The firm is known for their extensive retail and institutional distribution network, comprehensive research capabilities, and strategic advisory services that help companies achieve optimal outcomes in their public market debut.'
    } else if (firmName === 'Citigroup') {
      return 'Citigroup is a leading global investment bank with significant strength in capital markets and IPO execution. They are recognized for their international reach and ability to help companies access global investor bases. The firm has expertise across multiple sectors and is known for their innovative deal structures, strong relationships with institutional investors, and comprehensive support throughout the IPO process from preparation to post-listing.'
    } else if (firmName === 'Barclays') {
      return 'Barclays is a prominent global investment bank with strong capabilities in equity capital markets and IPO underwriting. They are known for their European and international market expertise, making them particularly valuable for companies seeking global investor participation. The firm has a reputation for their analytical approach, strong sector coverage, and ability to help companies navigate complex cross-border public offerings.'
    } else if (firmName === 'UBS') {
      return 'UBS is a leading global investment bank with exceptional strength in equity capital markets, particularly in technology and healthcare sectors. They are recognized for their international distribution capabilities and strong relationships with both institutional and retail investors globally. The firm is known for their research-driven approach, innovative deal structures, and ability to help companies achieve successful public market debuts across multiple geographies.'
    } else if (firmName === 'Deutsche Bank') {
      return 'Deutsche Bank is a major global investment bank with strong capabilities in equity capital markets and IPO underwriting. They are known for their European market leadership and extensive international network. The firm has expertise across diverse sectors and is recognized for their ability to execute complex transactions, provide strategic advisory services, and help companies access global capital markets effectively.'
    } else if (firmName === 'Jefferies') {
      return 'Jefferies is a leading middle-market investment bank known for their sector expertise, particularly in healthcare, technology, and consumer sectors. They excel at executing IPOs for growth companies and have built a reputation for their hands-on approach and deep industry knowledge. The firm is recognized for their ability to provide personalized service, innovative deal structures, and strategic guidance tailored to emerging growth companies preparing for public markets.'
    } else if (firmName === 'RBC Capital Markets') {
      return 'RBC Capital Markets is a leading North American investment bank with strong capabilities in equity capital markets and IPO underwriting. They are known for their deep sector expertise, particularly in technology, healthcare, and financial services. The firm has a reputation for their comprehensive approach to public offerings, strong relationships with institutional investors, and ability to help companies navigate the IPO process with strategic guidance and execution excellence.'
    }
    return `${firmName} is a leading investment bank providing underwriting and advisory services for companies preparing to go public. They specialize in ${sectorFocus.toLowerCase()} IPOs, offering comprehensive capital markets expertise, roadshow management, and strategic guidance throughout the public offering process.`
  } else if (category === 'Asset Manager') {
    if (firmName === 'BlackRock') {
      return 'BlackRock is the world\'s largest asset manager, managing trillions in assets across equity, fixed income, and alternative investments. They are a dominant force in index investing through their iShares ETFs and have extensive active management capabilities. The firm is known for their sophisticated risk management, technology platform (Aladdin), and significant influence as a major shareholder in public companies. BlackRock plays a crucial role in providing liquidity and stability for post-IPO companies, often becoming one of the largest institutional holders.'
    } else if (firmName === 'Vanguard') {
      return 'Vanguard is one of the world\'s largest asset managers, renowned for their low-cost index fund and ETF offerings. They are a leader in passive investing and have built a reputation for putting investor interests first through their unique mutual ownership structure. The firm manages massive institutional and retail portfolios, providing significant liquidity and long-term stability for public companies. Vanguard\'s index funds often become major shareholders in newly public companies, contributing to stable ownership bases.'
    } else if (firmName === 'Fidelity Investments') {
      return 'Fidelity Investments is one of the largest asset managers globally, with extensive capabilities in both active and passive investment management. They are known for their strong retail investor base, comprehensive research capabilities, and technology innovation in financial services. The firm manages significant institutional and retail portfolios, providing liquidity and stability for post-IPO companies. Fidelity is recognized for their long-term investment approach and ability to support companies through various market cycles.'
    } else if (firmName === 'State Street Global Advisors') {
      return 'State Street Global Advisors (SSGA) is one of the world\'s largest asset managers, best known for creating the first ETF (SPDR S&P 500) and their extensive ETF offerings. They are a leader in index investing and institutional asset management. The firm manages massive portfolios for pension funds, endowments, and other institutional investors, providing significant liquidity and stable ownership for public companies. SSGA is recognized for their index expertise and role as a major shareholder in public markets.'
    } else if (firmName === 'T. Rowe Price') {
      return 'T. Rowe Price is a leading global asset manager known for their active equity and fixed income management capabilities. They have a strong reputation for fundamental research and long-term investment approach. The firm manages significant institutional and retail portfolios, providing liquidity and stability for post-IPO companies. T. Rowe Price is recognized for their disciplined investment process, sector expertise, and ability to identify and hold high-quality companies for extended periods.'
    } else if (firmName === 'Invesco') {
      return 'Invesco is a leading global asset manager with diverse capabilities across active and passive investment strategies, including ETFs and mutual funds. They are known for their quantitative and fundamental investment approaches across multiple asset classes. The firm manages substantial institutional and retail portfolios, providing liquidity and market stability for public companies. Invesco is recognized for their global reach, innovative investment solutions, and ability to help companies maintain strong investor relations.'
    } else if (firmName === 'Franklin Templeton') {
      return 'Franklin Templeton is a major global asset manager with extensive capabilities in equity, fixed income, and alternative investments. They are known for their global investment expertise and long-term value-oriented approach. The firm manages significant institutional and retail portfolios worldwide, providing liquidity and stability for post-IPO companies. Franklin Templeton is recognized for their disciplined investment process, global research capabilities, and ability to support companies through various market environments.'
    } else if (firmName === 'AllianceBernstein (AB)') {
      return 'AllianceBernstein is a leading global asset manager known for their active equity and fixed income management, with particular strength in research-driven investment strategies. They are recognized for their fundamental research capabilities and long-term investment approach. The firm manages substantial institutional and high-net-worth portfolios, providing liquidity and stable ownership for public companies. AB is known for their sector expertise, rigorous investment process, and ability to identify long-term value creation opportunities.'
    } else if (firmName === 'J.P. Morgan Asset Management') {
      return 'J.P. Morgan Asset Management is one of the world\'s largest asset managers, offering comprehensive investment solutions across equities, fixed income, alternatives, and multi-asset strategies. They are known for their sophisticated investment capabilities, extensive research resources, and global reach. The firm manages massive institutional and retail portfolios, providing significant liquidity and stability for post-IPO companies. J.P. Morgan AM is recognized for their ability to combine investment expertise with the broader firm\'s capital markets capabilities.'
    } else if (firmName === 'Neuberger Berman') {
      return 'Neuberger Berman is a leading independent asset manager known for their active equity and fixed income management capabilities. They are recognized for their fundamental research, long-term investment approach, and employee ownership structure. The firm manages substantial institutional and high-net-worth portfolios, providing liquidity and stable ownership for public companies. Neuberger Berman is known for their disciplined investment process, sector expertise, and ability to identify and support high-quality companies over extended periods.'
    }
    return `${firmName} is a major asset manager providing liquidity and stability for post-IPO companies. They manage institutional and retail investment portfolios, including public market equities in the ${sectorFocus.toLowerCase()} sector, helping companies maintain strong investor relations and long-term shareholder value.`
  }
  
  return firm.description || `${firmName} is a ${category} firm focused on ${sectorFocus.toLowerCase()} investments.`
}

const buildInitialCards = (source) =>
  source.map((firm) => ({
    id: `firm-${firm.id}`,
    name: firm.firm_name,
    category: firm.category,
    address: firm.hq_address,
    website: firm.website,
    logo: buildImageUrl(firm.logo_url),
    roundStage: firm.round_stage,
    focusStage: firm.focus_stage,
    investmentRange: firm.required_capital_usd,
    typicalCheck: firm.typical_check_size,
    description: generateDescription(firm),
    sectorFocus: firm.sector_focus,
    entryBarrier: firm.entry_barrier,
    portfolio: PORTFOLIO_COMPANIES[firm.firm_name] || null,
  }))

function App() {
  const companyCards = useMemo(() => buildInitialCards(firms), [])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [selectedFirmId, setSelectedFirmId] = useState(null)
  // Store dropbox assignments per round
  const [dropboxAssignments, setDropboxAssignments] = useState(() => {
    const initial = {}
    FUNDING_ROUNDS.forEach((round) => {
      initial[round.id] = {
        dropbox1: null,
        dropbox2: null,
        dropbox3: null,
      }
    })
    return initial
  })
  const [draggedFirmId, setDraggedFirmId] = useState(null)
  const [dragOverDropbox, setDragOverDropbox] = useState(null)
  const scrollContainerRef = useRef(null)

  const currentRound = FUNDING_ROUNDS[currentRoundIndex]

  const firmsForCurrentRound = useMemo(() => {
    // Get firms assigned to dropboxes in current round
    const currentRoundAssignments = dropboxAssignments[currentRound.id] || {
      dropbox1: null,
      dropbox2: null,
      dropbox3: null,
    }
    const assignedFirmIds = new Set([
      currentRoundAssignments.dropbox1,
      currentRoundAssignments.dropbox2,
      currentRoundAssignments.dropbox3,
    ].filter(Boolean))
    
    // Filter firms: show only those that match the round AND are not in dropboxes
    return companyCards.filter((card) => {
      if (!card.roundStage) return false
      // Normalize both values for comparison
      // Convert "Series A" -> "series-a", "Pre-Seed" -> "pre-seed", etc.
      const cardStage = card.roundStage.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
      const roundId = currentRound.id.toLowerCase()
      const matchesRound = cardStage === roundId
      const notInDropbox = !assignedFirmIds.has(card.id)
      return matchesRound && notInDropbox
    })
  }, [companyCards, currentRound.id, dropboxAssignments])

  const selectedFirm = useMemo(() => {
    if (!selectedFirmId) return null
    return companyCards.find((card) => card.id === selectedFirmId)
  }, [selectedFirmId, companyCards])

  const handlePrevRound = () => {
    setCurrentRoundIndex((prev) => Math.max(0, prev - 1))
    setSelectedFirmId(null)
  }

  const handleNextRound = () => {
    setCurrentRoundIndex((prev) => Math.min(FUNDING_ROUNDS.length - 1, prev + 1))
    setSelectedFirmId(null)
  }

  const handleFirmClick = (firmId) => {
    setSelectedFirmId(firmId)
  }

  const handleDropboxClick = (dropboxId, assignedFirmId) => {
    // If clicking on an empty dropbox and there's a selected firm, assign it
    if (!assignedFirmId && selectedFirmId) {
      setDropboxAssignments((prev) => ({
        ...prev,
        [currentRound.id]: {
          ...prev[currentRound.id],
          [dropboxId]: selectedFirmId,
        },
      }))
    }
    // If clicking on a filled dropbox, select that firm to show details
    else if (assignedFirmId) {
      setSelectedFirmId(assignedFirmId)
    }
  }

  const handleRemoveFromDropbox = (dropboxId, e) => {
    e.stopPropagation()
    const currentRoundAssignments = dropboxAssignments[currentRound.id] || {
      dropbox1: null,
      dropbox2: null,
      dropbox3: null,
    }
    const removedFirmId = currentRoundAssignments[dropboxId]
    
    setDropboxAssignments((prev) => ({
      ...prev,
      [currentRound.id]: {
        ...prev[currentRound.id],
        [dropboxId]: null,
      },
    }))
    
    // Clear selection if the removed firm was selected
    if (removedFirmId === selectedFirmId) {
      setSelectedFirmId(null)
    }
  }

  const handleDragStart = (firmId) => (e) => {
    setDraggedFirmId(firmId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', firmId)
    // Create a custom drag image
    try {
      const dragImage = e.currentTarget.cloneNode(true)
      dragImage.style.opacity = '0.9'
      dragImage.style.transform = 'scale(1.05)'
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      dragImage.style.left = '-1000px'
      dragImage.style.pointerEvents = 'none'
      document.body.appendChild(dragImage)
      const rect = e.currentTarget.getBoundingClientRect()
      e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2)
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage)
        }
      }, 0)
    } catch (error) {
      // Fallback if drag image creation fails
      console.warn('Drag image creation failed:', error)
    }
  }

  const handleDragEnd = () => {
    setDraggedFirmId(null)
    setDragOverDropbox(null)
  }

  const handleDragOver = (dropboxId) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDropbox(dropboxId)
  }

  const handleDragLeave = () => {
    setDragOverDropbox(null)
  }

  const handleDrop = (dropboxId) => (e) => {
    e.preventDefault()
    const firmId = draggedFirmId || e.dataTransfer.getData('text/plain')
    if (firmId) {
      setDropboxAssignments((prev) => ({
        ...prev,
        [currentRound.id]: {
          ...prev[currentRound.id],
          [dropboxId]: firmId,
        },
      }))
    }
    setDraggedFirmId(null)
    setDragOverDropbox(null)
  }

  const handleFirmListDrop = (e) => {
    e.preventDefault()
    const firmId = draggedFirmId || e.dataTransfer.getData('text/plain')
    if (firmId) {
      // Remove firm from all dropboxes in current round
      const currentRoundAssignments = dropboxAssignments[currentRound.id] || {
        dropbox1: null,
        dropbox2: null,
        dropbox3: null,
      }
      const updatedAssignments = { ...currentRoundAssignments }
      Object.keys(updatedAssignments).forEach((key) => {
        if (updatedAssignments[key] === firmId) {
          updatedAssignments[key] = null
        }
      })
      setDropboxAssignments((prev) => ({
        ...prev,
        [currentRound.id]: updatedAssignments,
      }))
    }
    setDraggedFirmId(null)
    setDragOverDropbox(null)
  }

  const handleFirmListDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const getFirmById = (firmId) => {
    if (!firmId) return null
    return companyCards.find((card) => card.id === firmId)
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0
    }
  }, [currentRoundIndex])

    return (
    <div className="app-container">
      <div className="navigation-buttons">
        <button
          className="nav-button nav-button-left"
          onClick={handlePrevRound}
          disabled={currentRoundIndex === 0}
          aria-label="Previous round"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
          <button
          className="nav-button nav-button-right"
          onClick={handleNextRound}
          disabled={currentRoundIndex === FUNDING_ROUNDS.length - 1}
          aria-label="Next round"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          </button>
          </div>

      <div className="main-content">
        <div className="top-section">
          <div className="left-panel">
            <h1 className="round-title">{currentRound.title}</h1>
            <div className="round-info">
              <div className="info-section">
                <h3>Purpose</h3>
                <p>{currentRound.purpose}</p>
              </div>
              <div className="info-section">
                <h3>Description</h3>
                <p>{currentRound.description}</p>
              </div>
              <div className="info-section">
                <h3>Conditions</h3>
                <p>{currentRound.conditions}</p>
              </div>
              {currentRound.explanation && (
                <div className="info-section">
                  <h3>Explanation</h3>
                  <p>{currentRound.explanation}</p>
                </div>
              )}
            </div>
          </div>

          <div className="right-panel">
            <div className="dropboxes-section">
              <h2 className="section-title">My Picks</h2>
              <div className="dropboxes">
                {[1, 2, 3].map((num) => {
                  const dropboxId = `dropbox${num}`
                  const currentRoundAssignments = dropboxAssignments[currentRound.id] || {
                    dropbox1: null,
                    dropbox2: null,
                    dropbox3: null,
                  }
                  const assignedFirmId = currentRoundAssignments[dropboxId]
                  const assignedFirm = getFirmById(assignedFirmId)
  return (
                    <div
                      key={dropboxId}
                      className={`dropbox ${assignedFirm ? 'filled' : 'empty'} ${dragOverDropbox === dropboxId ? 'drag-over' : ''}`}
                      onClick={() => handleDropboxClick(dropboxId, assignedFirmId)}
                      onDragOver={handleDragOver(dropboxId)}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop(dropboxId)}
                    >
                      {assignedFirm ? (
                        <>
                <button
                            className="remove-button"
                            onClick={(e) => handleRemoveFromDropbox(dropboxId, e)}
                            aria-label="Remove firm"
                          >
                            ×
                </button>
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              handleDragStart(assignedFirmId)(e)
                            }}
                            onDragEnd={handleDragEnd}
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              width: '100%',
                              cursor: 'grab'
                            }}
                          >
                            <img
                              src={assignedFirm.logo || '/vite.svg'}
                              alt={assignedFirm.name}
                              className="dropbox-logo"
                              draggable={false}
                              onError={(e) => {
                                e.target.src = '/vite.svg'
                              }}
                            />
                            <span className="dropbox-firm-name">
                              {assignedFirm.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="dropbox-placeholder">Choice {num}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="firm-details-section">
              {selectedFirm ? (
                <>
                  <h3 className="details-title">{selectedFirm.name}</h3>
                  <div className="details-content">
                    {selectedFirm.description && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Description:</span>
                        <p className="detail-text">{selectedFirm.description}</p>
          </div>
                    )}
                    {selectedFirm.portfolio && selectedFirm.portfolio.length > 0 && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Notable Portfolio Companies:</span>
                        <div className="portfolio-list">
                          {selectedFirm.portfolio.map((company, index) => (
                            <a
                              key={index}
                              href={company.url}
                              target="_blank"
                              rel="noreferrer"
                              className="portfolio-link"
                            >
                              {company.name}
                            </a>
              ))}
            </div>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{selectedFirm.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedFirm.address}</span>
                    </div>
                    {selectedFirm.website && (
                      <div className="detail-item">
                        <span className="detail-label">Website:</span>
                        <a href={selectedFirm.website} target="_blank" rel="noreferrer" className="detail-link">
                          {selectedFirm.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {selectedFirm.sectorFocus && (
                      <div className="detail-item">
                        <span className="detail-label">Sector Focus:</span>
                        <span className="detail-value">{selectedFirm.sectorFocus}</span>
                      </div>
                    )}
                    {selectedFirm.typicalCheck && (
                      <div className="detail-item">
                        <span className="detail-label">Typical Check Size:</span>
                        <span className="detail-value">{selectedFirm.typicalCheck}</span>
                      </div>
                    )}
                    {selectedFirm.investmentRange && (
                      <div className="detail-item">
                        <span className="detail-label">Investment Range:</span>
                        <span className="detail-value">{selectedFirm.investmentRange}</span>
        </div>
                    )}
                    {selectedFirm.entryBarrier && (
                      <div className="detail-item">
                        <span className="detail-label">Entry Barrier:</span>
                        <span className="detail-value">{selectedFirm.entryBarrier}</span>
                  </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Click on a firm below to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="firms-section">
          <div 
            className="firms-scroll-container" 
            ref={scrollContainerRef}
            onDragOver={handleFirmListDragOver}
            onDrop={handleFirmListDrop}
          >
            <div className="firms-list">
              {firmsForCurrentRound.length > 0 ? (
                firmsForCurrentRound.map((firm) => (
                  <div
                    key={firm.id}
                    className={`firm-card ${selectedFirmId === firm.id ? 'selected' : ''} ${draggedFirmId === firm.id ? 'dragging' : ''}`}
                    onClick={() => handleFirmClick(firm.id)}
                    draggable
                    onDragStart={handleDragStart(firm.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={firm.logo || '/vite.svg'}
                      alt={firm.name}
                      className="firm-logo"
                      onError={(e) => {
                        e.target.src = '/vite.svg'
                      }}
                    />
                    <h4 className="firm-name">{firm.name}</h4>
                    <p className="firm-category">{firm.category}</p>
                  </div>
                ))
              ) : (
                <div className="no-firms">
                  <p>No firms available for this round</p>
              </div>
              )}
            </div>
          </div>
        </div>
        </div>
    </div>
  )
}

export default App
