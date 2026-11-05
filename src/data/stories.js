// Data for the partner profile's "Success stories" section.
//
// REAL: each partner's stories as listed on its frappe.io partner page
// (frappe.io/partners/<country>/<slug>), collected Nov 2026, up to five each,
// with the customer's logo from that page (saved in `assets/clients/`). Titles
// and industries are as the page shows them; "Others" is dropped. Three
// partners list none (Finbyz Tech, ALYF, Momscode), and their section says so.
//
// Known quirks of the source pages, kept as they are: Korecent's page spells
// Artios "Aritos" in one title; Hybrowlabs lists Walnut School twice, as two
// stories; NestorBird's AVON story is tagged Healthcare.

const logos = import.meta.glob('../assets/clients/*', { eager: true, query: '?url', import: 'default' })
// `?v=2`: the files were edited in place once, and a browser that cached the
// old ones would keep showing them under the same URL.
const logoFor = (name) => {
  const url = name ? Object.entries(logos).find(([path]) => path.split('/').pop().replace(/\.[^.]+$/, '') === name)?.[1] : null
  return url ? `${url}?v=2` : null
}

const STORIES = {
  "tridots-tech": [
    {
      "customer": "Pupa",
      "title": "Pupa's Growth Story From Disconnected Systems to One ERP",
      "url": "https://frappe.io/stories/Pupa",
      "industry": "Manufacturing",
      "logo": "tridots-tech--pupa"
    },
    {
      "customer": "Opptra",
      "title": "Opptra Simplifies Global eCommerce Distribution with ERPNext",
      "url": "https://frappe.io/stories/Opptra",
      "industry": "E-commerce",
      "logo": "tridots-tech--opptra"
    },
    {
      "customer": "Sansel",
      "title": "Implementing ERPNext for Sansel's business success",
      "url": "https://frappe.io/stories/Sansel",
      "industry": "Medical Device Manufacturing",
      "logo": "tridots-tech--sansel"
    },
    {
      "customer": "Finmart",
      "title": "Finmart Brings Sales, Finance, and Customer Support Together with ERPNext",
      "url": "https://frappe.io/stories/Finmart",
      "industry": "Banking, Insurance and Broking",
      "logo": "tridots-tech--finmart"
    },
    {
      "customer": "Plumage",
      "title": "Plumage group's business transformation with ERPNext",
      "url": "https://frappe.io/stories/Plumage",
      "industry": "Electronics Manufacturing",
      "logo": "tridots-tech--plumage"
    }
  ],
  "software-work": [
    {
      "customer": "Palki Food Services",
      "title": "Empowering a young workforce through ERPNext implementation",
      "url": "https://frappe.io/stories/Palki%20Food%20Services",
      "industry": "Food and Beverages",
      "logo": "software-work--palki-food-services"
    },
    {
      "customer": "Parikh Power Pvt Ltd",
      "title": "Transforming Operations at Parikh Power with ERPNext Implementation",
      "url": "https://frappe.io/stories/Parikh%20Power%20Pvt%20Ltd",
      "industry": "Manufacturing",
      "logo": "software-work--parikh-power-pvt-ltd"
    },
    {
      "customer": "INSTEEL Engineers Pvt Ltd",
      "title": "Transforming Operations at Insteel Engineers with ERPNext",
      "url": "https://frappe.io/stories/INSTEEL%20Engineers%20Pvt%20Ltd",
      "industry": "Engineering and Construction",
      "logo": "software-work--insteel-engineers-pvt-ltd"
    },
    {
      "customer": "Santi Software Services LLP",
      "title": "Streamlining sales operations with ERPNext CRM",
      "url": "https://frappe.io/stories/Santi%20Software%20Services%20LLP",
      "industry": "Manufacturing",
      "logo": "software-work--santi-software-services-llp"
    },
    {
      "customer": "Exotherm Instruments Pvt Ltd",
      "title": "Transforming Exotherm's operations with ERPNext",
      "url": "https://frappe.io/stories/Exotherm%20Instruments%20Pvt%20Ltd",
      "industry": "Manufacturing",
      "logo": "software-work--exotherm-instruments-pvt-ltd"
    }
  ],
  "new-indictrans": [
    {
      "customer": "FreightFox",
      "title": "From manual chaos to smart automation: FreightFox’s ERPNext portal",
      "url": "https://frappe.io/stories/FreightFox",
      "industry": "Logistics",
      "logo": "new-indictrans--freightfox"
    },
    {
      "customer": "Whitehats LLC",
      "title": "ERPNext helps Whitehats prevent revenue leakage",
      "url": "https://frappe.io/stories/Whitehats%20LLC",
      "industry": "Services",
      "logo": "new-indictrans--whitehats-llc"
    },
    {
      "customer": "Bren Corporation",
      "title": "Revolutionizing Real Estate Operations of Bren Corporation: Automating HR Processes and More with ERPNext",
      "url": "https://frappe.io/stories/Bren%20Corporation",
      "industry": "Real Estate",
      "logo": "new-indictrans--bren-corporation"
    },
    {
      "customer": "DFM Foods Limited",
      "title": "How DFM Foods simplified supply chain operations with ERPNext",
      "url": "https://frappe.io/stories/DFM%20Foods%20Limited",
      "industry": "Fast Moving Consumer Goods",
      "logo": "new-indictrans--dfm-foods-limited"
    },
    {
      "customer": "Shree Electricals",
      "title": "Optimising manufacturing operations for Shree Electricals with ERPNext",
      "url": "https://frappe.io/stories/Shree%20Electricals",
      "industry": "Manufacturing",
      "logo": "new-indictrans--shree-electricals"
    }
  ],
  "8848-digital": [
    {
      "customer": "Lifelong",
      "title": "A leading manufacturer of assembly products solved the challenge of supply chain mismatch with ERPNext",
      "url": "https://frappe.io/stories/Lifelong",
      "industry": "Discrete Manufacturing",
      "logo": "8848-digital--lifelong"
    }
  ],
  "greycube-technologies": [
    {
      "customer": "CIIE-IIMA",
      "title": "CIIE - IIM Ahmedabad successfully migrated from QuickBooks to ERPNext",
      "url": "https://frappe.io/stories/CIIE-IIMA",
      "industry": "Education",
      "logo": "greycube-technologies--ciie-iima"
    },
    {
      "customer": "Ground Screw",
      "title": "How Ground Screw Company Streamlined Operations and Prepared for Growth with ERPNext",
      "url": "https://frappe.io/stories/Ground%20Screw",
      "industry": "Manufacturing",
      "logo": "greycube-technologies--ground-screw"
    },
    {
      "customer": "Compartment S4",
      "title": "Young visionary architects from Compartment S4 streamline project management, HR & payroll with ERPNext",
      "url": "https://frappe.io/stories/Compartment%20S4",
      "industry": "Professional services",
      "logo": "greycube-technologies--compartment-s4"
    },
    {
      "customer": "Massive Restaurants",
      "title": "Massive Restaurant chain with 16 brands and 130+ outlets banking the backend on ERPNext",
      "url": "https://frappe.io/stories/Massive%20Restaurants",
      "industry": "Hotels, Restaurants and Cafes",
      "logo": "greycube-technologies--massive-restaurants"
    },
    {
      "customer": "Sandeep Enterprises",
      "title": "Unifying Trading & Distribution Operation with ERPNext",
      "url": "https://frappe.io/stories/Sandeep%20Enterprises",
      "industry": "Trading and Distribution",
      "logo": "greycube-technologies--sandeep-enterprises"
    }
  ],
  "wahni": [
    {
      "customer": "FerTech",
      "title": "Large steel window and door manufacturer increases revenues by 15%",
      "url": "https://frappe.io/stories/FerTech",
      "industry": "Steel Manufacturing",
      "logo": "wahni--fertech"
    },
    {
      "customer": "Q Spices",
      "title": "ERPNext & DISA Power Q Spices' Journey Toward Quality-Led, Scalable Manufacturing and Distribution",
      "url": "https://frappe.io/stories/Q%20Spices",
      "industry": "Fast Moving Consumer Goods",
      "logo": "wahni--q-spices"
    },
    {
      "customer": "RaajaRam",
      "title": "How a 3rd generation Kuthampally handloom business transformed with ERPNext",
      "url": "https://frappe.io/stories/RaajaRam",
      "industry": "Trading and Distribution",
      "logo": "wahni--raajaram"
    },
    {
      "customer": "Furnishka",
      "title": "ERPNext Powers Furnishka's Journey Towards Pan-India Expansion",
      "url": "https://frappe.io/stories/Furnishka",
      "industry": "Furniture Manufacturing",
      "logo": "wahni--furnishka"
    },
    {
      "customer": "We Assist",
      "title": "“We Assist” chooses ERPNext to lodge a million transaction a month",
      "url": "https://frappe.io/stories/We%20Assist",
      "industry": "Banking, Insurance and Broking",
      "logo": "wahni--we-assist"
    }
  ],
  "wahni-it-solutions-fze": [
    {
      "customer": "U-artist",
      "title": "Dubai’s leading furniture supplier adopts ERPNext",
      "url": "https://frappe.io/stories/U-artist",
      "industry": "Professional services",
      "logo": "wahni-it-solutions-fze--u-artist"
    },
    {
      "customer": "Petropipe",
      "title": "How Petropipe streamlined operations across 9 entities and 9 countries ERPNext",
      "url": "https://frappe.io/stories/Petropipe",
      "industry": null,
      "logo": "wahni-it-solutions-fze--petropipe"
    },
    {
      "customer": "FAS Arabia LLC",
      "title": "How FAS Arabia enabled engineering & logistics and wired an agile digital backbone",
      "url": "https://frappe.io/stories/FAS%20Arabia%20LLC",
      "industry": "Trading and Distribution",
      "logo": "wahni-it-solutions-fze--fas-arabia-llc"
    },
    {
      "customer": "Fashion Planet",
      "title": "How ERPNext revolutionized retail and e-commerce operations",
      "url": "https://frappe.io/stories/Fashion%20Planet",
      "industry": "Textile Manufacturing",
      "logo": "wahni-it-solutions-fze--fashion-planet"
    },
    {
      "customer": "Pogliano Busbar FZC",
      "title": "How Pogliano Busbar engineered a smarter operation with ERPNext",
      "url": "https://frappe.io/stories/Pogliano%20Busbar%20FZC",
      "industry": "Manufacturing",
      "logo": "wahni-it-solutions-fze--pogliano-busbar-fzc"
    }
  ],
  "hybrowlabs": [
    {
      "customer": "Eco Saras",
      "title": "Eco Saras Group Streamlines Multi-Company Operations with ERPNext",
      "url": "https://frappe.io/stories/Eco%20Saras",
      "industry": "Electronics Manufacturing",
      "logo": "hybrowlabs--eco-saras"
    },
    {
      "customer": "Iskcon Pune",
      "title": "Empowering Devotees and Temples, ERPNext Revolutionises ISKCON’s Operations",
      "url": "https://frappe.io/stories/Iskcon%20Pune",
      "industry": "Nonprofit",
      "logo": "hybrowlabs--iskcon-pune"
    },
    {
      "customer": "Walnut School",
      "title": "Walnut Schools manages their entire operations using Frappe",
      "url": "https://frappe.io/stories/Walnut%20School",
      "industry": "Education",
      "logo": "hybrowlabs--walnut-school"
    },
    {
      "customer": "Walnut Schools",
      "title": "How Walnut Schools streamlined communication with parents with Frappe",
      "url": "https://frappe.io/stories/Walnut%20Schools",
      "industry": "Education",
      "logo": "hybrowlabs--walnut-schools"
    },
    {
      "customer": "Sequoia Healthcare",
      "title": "Sequoia Healthcare runs MRI and CT scanner manufacturing, quality and service on one ERPNext system",
      "url": "https://frappe.io/stories/Sequoia%20Healthcare",
      "industry": "Medical Device Manufacturing",
      "logo": "hybrowlabs--sequoia-healthcare"
    }
  ],
  "finbyz-tech": [],
  "alyf": [],
  "craft-interactive": [
    {
      "customer": "KEPCO Group",
      "title": "KEPCO Group's digital transformation with ERPNext",
      "url": "https://frappe.io/stories/KEPCO%20Group",
      "industry": "Services",
      "logo": "craft-interactive--kepco-group"
    },
    {
      "customer": "Rely Industries",
      "title": "Rely industries chooses ERPNext",
      "url": "https://frappe.io/stories/Rely%20Industries",
      "industry": "Furniture Manufacturing",
      "logo": "craft-interactive--rely-industries"
    },
    {
      "customer": "Adeco Technologies",
      "title": "ADECO's Journey to Smarter Business Management with ERPNext",
      "url": "https://frappe.io/stories/Adeco%20Technologies",
      "industry": "Services",
      "logo": "craft-interactive--adeco-technologies"
    },
    {
      "customer": "NovaTech Abu Dhabi",
      "title": "How ERPNext rescued NovaTech Oil & Gas after multiple ERP implementation failures",
      "url": "https://frappe.io/stories/NovaTech%20Abu%20Dhabi",
      "industry": "Trading and Distribution",
      "logo": "craft-interactive--novatech-abu-dhabi"
    },
    {
      "customer": "Zeez International Group",
      "title": "Zeez International UAE on ERPNext: automotive and fuel station chain",
      "url": "https://frappe.io/stories/Zeez%20International%20Group",
      "industry": "Automotive Manufacturing",
      "logo": "craft-interactive--zeez-international-group"
    }
  ],
  "kingstech-services": [
    {
      "customer": "Heartland Enterprise Centre Singapore",
      "title": "From hardcopy to digital: HECS streamlines business advisory sessions with Frappe CRM",
      "url": "https://frappe.io/stories/Heartland%20Enterprise%20Centre%20Singapore",
      "industry": "Consulting",
      "logo": "kingstech-services--heartland-enterprise-centre-singapore"
    }
  ],
  "navari": [
    {
      "customer": "Cropchem",
      "title": "How Cropchem and Speedling Nurseries manage their supply chain using ERPNext",
      "url": "https://frappe.io/stories/Cropchem",
      "industry": "Agriculture",
      "logo": "navari--cropchem"
    },
    {
      "customer": "Meru Greens",
      "title": "Kenya’s largest horticulture company manages their supply chain with ERPNext",
      "url": "https://frappe.io/stories/Meru%20Greens",
      "industry": "Food and Beverages",
      "logo": "navari--meru-greens"
    },
    {
      "customer": "Bigger Steel",
      "title": "One of the largest steel companies in Kenya chooses ERPNext: Bigger Steel",
      "url": "https://frappe.io/stories/Bigger%20Steel",
      "industry": "Steel Manufacturing",
      "logo": "navari--bigger-steel"
    },
    {
      "customer": "CIIRA Agrovet",
      "title": "AGRO distribution company transforms operations with ERPNext",
      "url": "https://frappe.io/stories/CIIRA%20Agrovet",
      "industry": "Goods Trading",
      "logo": "navari--ciira-agrovet"
    },
    {
      "customer": "Victory Farms",
      "title": "Fisheries giant integrated their disparate applications to one platform with ERPNext",
      "url": "https://frappe.io/stories/Victory%20Farms",
      "industry": "Livestock",
      "logo": "navari--victory-farms"
    }
  ],
  "korecent": [
    {
      "customer": "Chewy",
      "title": "Chewy's ERPNext Success Story",
      "url": "https://frappe.io/stories/Chewy",
      "industry": null,
      "logo": "korecent--chewy"
    },
    {
      "customer": "Artios Technologies",
      "title": "Aritos Technologies' ERPNext success story",
      "url": "https://frappe.io/stories/Artios%20Technologies",
      "industry": "Services",
      "logo": "korecent--artios-technologies"
    },
    {
      "customer": "IVM",
      "title": "IVM: Success Story of Vending Machine Operator",
      "url": "https://frappe.io/stories/IVM",
      "industry": "Services",
      "logo": "korecent--ivm"
    },
    {
      "customer": "Supreme Tile",
      "title": "Automating sales & supply chain for Supreme Tiles with ERPNext",
      "url": "https://frappe.io/stories/Supreme%20Tile",
      "industry": "Manufacturing",
      "logo": "korecent--supreme-tile"
    },
    {
      "customer": "Biiibo",
      "title": "Biiibo’s lightening-fast deliveries using ERPNext and Framework",
      "url": "https://frappe.io/stories/Biiibo’s%20Lightening-Fast%20Deliveries%20using%20ERPNext%20and%20Framework",
      "industry": "Engineering and Construction",
      "logo": "korecent--biiibo"
    }
  ],
  "sanskar-technolab": [
    {
      "customer": "Vijay Mamra",
      "title": "Food manufacturer ditches SAP",
      "url": "https://frappe.io/stories/Vijay%20Mamra",
      "industry": "Food and Beverages",
      "logo": "sanskar-technolab--vijay-mamra"
    },
    {
      "customer": "Orient Electric",
      "title": "Orient Electric Builds a Pan-India Sales Pipeline on Frappe CRM",
      "url": "https://frappe.io/stories/Orient%20Electric",
      "industry": "Electronics Manufacturing",
      "logo": "sanskar-technolab--orient-electric"
    },
    {
      "customer": "Advantis Quartz LLP",
      "title": "Advantis Quartz Cuts Manufacturing Costs by 15% with ERPNext",
      "url": "https://frappe.io/stories/Advantis%20Quartz%20LLP",
      "industry": "Manufacturing",
      "logo": "sanskar-technolab--advantis-quartz-llp"
    },
    {
      "customer": "Farmex Freshia Trading LLC",
      "title": "Distribution company Farmex Freshia’s success with ERPNext",
      "url": "https://frappe.io/stories/Farmex%20Freshia%20Trading%20LLC",
      "industry": "Trading and Distribution",
      "logo": "sanskar-technolab--farmex-freshia-trading-llc"
    },
    {
      "customer": "Silver Blue Global Solution PTE LTD",
      "title": "ERPNext helps Silver Blue Water scale distribution operations across 25,000+ retailers",
      "url": "https://frappe.io/stories/Silver%20Blue%20Global%20Solution%20PTE%20LTD",
      "industry": "Food and Beverages",
      "logo": "sanskar-technolab--silver-blue-global-solution-pte-ltd"
    }
  ],
  "promantia": [
    {
      "customer": "Rangsutra",
      "title": "Omni-channel fashion brand digitises  end to end manufacturing and distribution",
      "url": "https://frappe.io/stories/Rangsutra",
      "industry": "Textile Manufacturing",
      "logo": "promantia--rangsutra"
    }
  ],
  "nestorbird": [
    {
      "customer": "AVON",
      "title": "Transforming PAN-India Beauty Retail Operations with ERPNext",
      "url": "https://frappe.io/stories/AVON",
      "industry": "Healthcare",
      "logo": "nestorbird--avon"
    },
    {
      "customer": "P•TAL",
      "title": "How GETPOS implementation helps multi-outlet retail businesses streamline operations",
      "url": "https://frappe.io/stories/P•TAL",
      "industry": "Retail",
      "logo": "nestorbird--p-tal"
    },
    {
      "customer": "RYK Hospital",
      "title": "RYK Hospital - Upgrading Healthcare Operations with ERPNext",
      "url": "https://frappe.io/stories/RYK%20Hospital",
      "industry": "Healthcare",
      "logo": "nestorbird--ryk-hospital"
    },
    {
      "customer": "Tanteo Spirits",
      "title": "Catalyst in the growth of a spirits manufacturer controlled their cost with ERPNext",
      "url": "https://frappe.io/stories/Tanteo%20Spirits",
      "industry": "Food and Beverages",
      "logo": "nestorbird--tanteo-spirits"
    },
    {
      "customer": "Amaha Healthcare",
      "title": "Amaha Healthcare: ERPNext Healthcare Implementation",
      "url": "https://frappe.io/stories/Amaha%20Healthcare",
      "industry": "Healthcare",
      "logo": "nestorbird--amaha-healthcare"
    }
  ],
  "momscode": []
}

// The featured story's description: its opening paragraph on frappe.io,
// rewritten to start without the client's name (the logo and headline already
// carry it) and kept to facts the paragraph states. None where the page has no
// opening paragraph (Lifelong, Rangsutra).
const DESCRIPTIONS = {
  'tridots-tech': 'One of South India’s growing manufacturers of construction chemicals, cleaning solutions, kitchenware and sanitary ware.',
  'software-work': 'A food services company run entirely by a team under 30.',
  'new-indictrans': 'A fast-growing logistics tech startup that wanted vendors to onboard, submit invoices and track updates without manual work.',
  'greycube-technologies': 'An Indian startup accelerator and incubator supporting early-stage startups at IIM Ahmedabad.',
  wahni: 'A steel door and window maker in Malappuram, Kerala, founded in 2016.',
  'wahni-it-solutions-fze': 'One of Dubai’s premier suppliers of high-end wall panels, home furniture, wardrobes and kitchen cabinets.',
  hybrowlabs: 'An industrial group of four companies, working in industrial automation.',
  'craft-interactive': 'A manufacturer and distributor of HVAC products for the refrigeration and air conditioning industry across the Middle East.',
  'kingstech-services': 'Set up in 2019 by Singapore’s Federation of Merchants’ Associations to revitalize heartland businesses.',
  navari: 'Two sister companies in agriculture: one supplies farm inputs, the other runs nurseries.',
  korecent: 'An American online retailer of pet food and pet products, based in Plantation, Florida.',
  'sanskar-technolab': 'A maker of puffed rice and poha since 1980.',
  nestorbird: 'A beauty, fashion and lifestyle retailer with over 200 stores across 60 cities.',
}

// A partner's stories, in the order its frappe.io page lists them:
// `{ id, client: { name, src }, segment, title, href }`.
export const storiesFor = (partner) =>
  (STORIES[partner.id] ?? []).map((s, i) => ({
    id: `${partner.id}-story-${i}`,
    client: { name: s.customer, src: logoFor(s.logo) },
    segment: s.industry,
    title: s.title,
    href: s.url,
    description: i === 0 ? (DESCRIPTIONS[partner.id] ?? null) : null,
  }))
