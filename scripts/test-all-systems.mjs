import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function readEnv() {
  const env = { ...process.env };
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

console.log("==================================================");
console.log("🚀 STARTING FULL PLATFORM & ERP (PHASE 1 + PHASE 2 + PHASE 3) TEST");
console.log("🌐 Target Supabase Instance:", url);
console.log("==================================================\n");

const supabase = createClient(url, key);

let passedTests = 0;
let failedTests = 0;

function assert(condition, name, extra = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${name} ${extra ? `(${extra})` : ""}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${extra ? `(${extra})` : ""}`);
    failedTests++;
  }
}

async function runTests() {
  // TEST 1: Database Table Existence & Permissions
  console.log("📋 1. Testing Core & ERP Database Tables...");
  const tables = [
    "leads",
    "orders",
    "order_items",
    "products",
    "profiles",
    "user_roles",
    "support_tickets",
    "blog_posts",
    "solar_packages",
    "email_send_log",
    "warehouses",
    "inventory_items",
    "serial_numbers",
    "stock_transfers",
    "invoices",
    "work_orders",
    "approval_requests",
    "warranty_claims",
    "chart_of_accounts",
    "journal_entries",
    "journal_entry_lines",
    "job_costing_records",
    "engineer_commissions",
    "engineer_certifications",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        assert(false, `Table '${table}' accessible`, `Error: ${error.message}`);
      } else {
        assert(true, `Table '${table}' accessible`);
      }
    } catch (err) {
      assert(false, `Table '${table}' exception`, err.message);
    }
  }

  // TEST 2: Storefront Lead Creation
  console.log("\n📬 2. Testing Storefront Lead & Enquiry Submission Flow...");
  const testLead = {
    full_name: "Test Customer (Automated QA)",
    phone: "+2348000000000",
    email: "test.lead@tiogatechnologies.com",
    location: "Ikeja, Lagos",
    products: ["5kVA Hybrid Solar Inverter"],
    budget: "₦3,000,000 - ₦5,000,000",
    timeline: "Immediately",
    main_goal: "24/7 Uninterrupted Clean Power",
    consent: true,
  };

  try {
    const { data: leadData, error: leadErr } = await supabase.from("leads").insert([testLead]).select().single();
    if (leadErr) {
      assert(false, "Lead creation into 'leads' table", `Error: ${leadErr.message}`);
    } else {
      assert(true, "Lead creation into 'leads' table", `ID: ${leadData?.id}`);
      assert(leadData?.full_name === testLead.full_name, "Lead data verification", `Name: ${leadData?.full_name}`);
    }
  } catch (err) {
    assert(false, "Lead submission exception", err.message);
  }

  // TEST 3: Order Creation
  console.log("\n🛒 3. Testing Order Creation & Item Linking Flow...");
  const testOrder = {
    order_number: `TIO-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: "QA Order Client",
    phone: "+2348123456789",
    email: "client@test.com",
    location: "12 Marina, Lagos Island",
    items_summary: "5kVA Solar Inverter (x1)",
    item_count: 1,
    status: "new",
  };

  try {
    const { data: orderData, error: orderErr } = await supabase.from("orders").insert([testOrder]).select().single();
    if (orderErr) {
      assert(false, "Order record created in 'orders' table", `Error: ${orderErr.message}`);
    } else {
      assert(true, "Order record created in 'orders' table", `Order #: ${orderData?.order_number}`);
    }
  } catch (err) {
    assert(false, "Order submission exception", err.message);
  }

  // TEST 4: Support Ticket
  console.log("\n🎫 4. Testing Support Ticket Creation...");
  const testTicket = {
    ticket_number: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    user_name: "Support Test User",
    user_contact: "+2348099999999",
    channel: "web",
    priority: "high",
    subject: "Automated QA Health Check",
    message: "This is a test message to verify ticket logging.",
    status: "open",
  };

  try {
    const { data: ticketData, error: ticketErr } = await supabase.from("support_tickets").insert([testTicket]).select().single();
    if (ticketErr) {
      assert(false, "Support ticket created in 'support_tickets' table", `Error: ${ticketErr.message}`);
    } else {
      assert(true, "Support ticket created in 'support_tickets' table", `Ticket #: ${ticketData?.ticket_number}`);
    }
  } catch (err) {
    assert(false, "Support ticket exception", err.message);
  }

  // TEST 5: Email Automation Senders & Admin Forwarding Rule
  console.log("\n✉️  5. Verifying Email Automation Sender Architecture...");
  const mailerPath = resolve("supabase/functions/_shared/mailer.ts");
  if (existsSync(mailerPath)) {
    const mailerContent = readFileSync(mailerPath, "utf8");
    assert(mailerContent.includes("sales@tiogatechnologies.com"), "Sender: sales@tiogatechnologies.com configured");
    assert(mailerContent.includes("support@tiogatechnologies.com"), "Sender: support@tiogatechnologies.com configured");
    assert(mailerContent.includes("info@tiogatechnologies.com"), "Sender: info@tiogatechnologies.com configured");
    assert(mailerContent.includes("tiogatechnologies@gmail.com"), "Admin CC: tiogatechnologies@gmail.com included");
    assert(mailerContent.includes("inememmanuel@gmail.com"), "Admin CC: inememmanuel@gmail.com included");
  } else {
    assert(false, "Mailer configuration file exists");
  }

  // TEST 6: Google SSO Integration
  console.log("\n🔑 6. Verifying Google SSO Integration in UI...");
  const authPath = resolve("src/pages/Auth.tsx");
  const adminLoginPath = resolve("src/pages/AdminLogin.tsx");
  if (existsSync(authPath) && existsSync(adminLoginPath)) {
    const authContent = readFileSync(authPath, "utf8");
    const adminContent = readFileSync(adminLoginPath, "utf8");
    assert(authContent.includes("signInWithGoogle") && authContent.includes("Continue with Google"), "Storefront Google SSO button integrated in /auth");
    assert(adminContent.includes("signInWithGoogle") && adminContent.includes("Sign in with Google"), "Admin Google SSO button integrated in /admin/login");
  } else {
    assert(false, "Auth files exist");
  }

  // TEST 7: ERP Phase 1 Validation
  console.log("\n🏢 7. Verifying ERP Phase 1 Functionality...");
  try {
    const { data: whData, error: whErr } = await supabase.from("warehouses").select("*");
    if (whErr) {
      assert(false, "Warehouses seeded & readable", whErr.message);
    } else {
      assert(whData && whData.length >= 2, "Warehouses seeded & readable", `${whData?.length} Hubs Active`);
    }

    const testInvoice = {
      invoice_no: `TIO-INV-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_type: "tax_invoice",
      customer_name: "ERP Enterprise Client",
      customer_phone: "+2348030001122",
      items: [{ description: "10kVA Commercial Solar Rig", quantity: 1, unit_price: 6500000, total: 6500000 }],
      subtotal: 6500000,
      vat_applicable: true,
      vat_amount: 487500,
      total_amount: 6987500,
      deposit_paid: 3000000,
      balance_due: 3987500,
      status: "partially_paid",
    };
    const { data: invData, error: invErr } = await supabase.from("invoices").insert([testInvoice]).select().single();
    if (invErr) {
      assert(false, "ERP Tax Invoice creation", invErr.message);
    } else {
      assert(true, "ERP Tax Invoice creation", `Invoice #: ${invData?.invoice_no}`);
    }

    const testSerial = {
      serial_no: `TIO-SN-TEST-${Math.floor(10000 + Math.random() * 90000)}`,
      product_name: "10kWh LiFePO4 Battery Pack",
      status: "in_stock",
    };
    const { data: snData, error: snErr } = await supabase.from("serial_numbers").insert([testSerial]).select().single();
    if (snErr) {
      assert(false, "ERP Serial Number registry", snErr.message);
    } else {
      assert(true, "ERP Serial Number registry", `Serial #: ${snData?.serial_no}`);
    }

    const testWO = {
      work_order_no: `WO-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "Dr. Alabi Williams",
      customer_phone: "+2348055554433",
      site_address: "Plot 8 Victoria Garden City, Lekki, Lagos",
      scheduled_date: new Date().toISOString().slice(0, 10),
      lead_engineer_name: "Engr. Sunday Okon",
      job_type: "solar_installation",
      status: "scheduled",
      bill_of_materials: [{ product_name: "5kVA Inverter", quantity: 1 }],
    };
    const { data: woData, error: woErr } = await supabase.from("work_orders").insert([testWO]).select().single();
    if (woErr) {
      assert(false, "ERP Work Order dispatching", woErr.message);
    } else {
      assert(true, "ERP Work Order dispatching", `WO #: ${woData?.work_order_no}`);
    }
  } catch (err) {
    assert(false, "ERP Phase 1 exception", err.message);
  }

  // TEST 8: ERP Phase 2 Validation (Approvals & OEM RMA)
  console.log("\n🛡️ 8. Verifying ERP Phase 2 Functionality...");
  try {
    // 8A: Approval Request Workflow
    const testApproval = {
      request_no: `APR-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      request_type: "discount_override",
      title: "12% Corporate Solar Discount Override",
      amount: 15000000,
      discount_percent: 12.0,
      requested_by_name: "Emeka Nwosu",
      requested_by_role: "sales_rep",
      required_approval_tier: "sales_manager",
      status: "pending",
    };
    const { data: aprData, error: aprErr } = await supabase.from("approval_requests").insert([testApproval]).select().single();
    if (aprErr) {
      assert(false, "ERP Multi-Tier Approval submission", aprErr.message);
    } else {
      assert(true, "ERP Multi-Tier Approval submission", `Request #: ${aprData?.request_no}`);
    }

    // 8B: OEM Manufacturer RMA Case
    const testRma = {
      rma_number: `RMA-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "Chief Raymond Dokpesi",
      customer_phone: "+2348030001234",
      customer_email: "dokpesi@client.com",
      product_name: "5kVA Hybrid Solar Inverter (Felicity)",
      serial: "FEL-INV-5002-TEST",
      oem_manufacturer: "Felicity Solar",
      reason: "faulty_component",
      description: "Error F58 Inverter Soft-Start Overcurrent",
      loaner_serial_no: "LOAN-5KVA-01",
      status: "under_review",
      oem_rma_status: "bench_test_failed",
    };
    const { data: rmaData, error: rmaErr } = await supabase.from("warranty_claims").insert([testRma]).select().single();
    if (rmaErr) {
      assert(false, "ERP OEM Manufacturer RMA logging", rmaErr.message);
    } else {
      assert(true, "ERP OEM Manufacturer RMA logging", `RMA #: ${rmaData?.rma_number} (${rmaData?.oem_manufacturer})`);
    }
  } catch (err) {
    assert(false, "ERP Phase 2 exception", err.message);
  }

  // TEST 9: ERP Phase 3 Validation (General Ledger, Job Costing & Commissions)
  console.log("\n💰 9. Verifying ERP Phase 3 Functionality...");
  try {
    // 9A: Chart of Accounts
    const testAcc = {
      code: `60${Math.floor(10 + Math.random() * 90)}`,
      name: "Solar Workshop Tool Maintenance",
      account_type: "expense",
      balance: 180000,
      description: "Maintenance and calibration of multimeters & crimping tools",
    };
    const { data: accData, error: accErr } = await supabase.from("chart_of_accounts").insert([testAcc]).select().single();
    if (accErr) {
      assert(false, "Chart of Accounts GL ledger", accErr.message);
    } else {
      assert(true, "Chart of Accounts GL ledger", `Account: ${accData?.code} - ${accData?.name}`);
    }

    // 9B: Balanced Double-Entry Journal Entry
    const testJrn = {
      entry_no: `JRN-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      entry_date: new Date().toISOString().slice(0, 10),
      reference_type: "invoice",
      reference_no: "INV-2608-TEST",
      narration: "Direct solar installation revenue collection",
      total_debit: 2500000,
      total_credit: 2500000,
      status: "posted",
    };
    const { data: jrnData, error: jrnErr } = await supabase.from("journal_entries").insert([testJrn]).select().single();
    if (jrnErr) {
      assert(false, "Double-Entry Journal Entry posting", jrnErr.message);
    } else {
      assert(true, "Double-Entry Journal Entry posting", `Journal #: ${jrnData?.entry_no}`);
    }

    // 9C: Job Costing & Gross Margin Record
    const testJob = {
      job_no: `JOB-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      work_order_no: "WO-2608-9999",
      customer_name: "Alhaji Shehu Garba",
      system_description: "10kVA Commercial Solar Inverter + 20kWh Battery",
      contract_revenue: 8000000,
      hardware_cogs: 5200000,
      technician_labor_cost: 400000,
      logistics_cost: 150000,
      miscellaneous_cost: 50000,
      gross_profit: 2200000,
      gross_margin_percent: 27.5,
    };
    const { data: jobData, error: jobErr } = await supabase.from("job_costing_records").insert([testJob]).select().single();
    if (jobErr) {
      assert(false, "Job Costing & Margin calculation", jobErr.message);
    } else {
      assert(true, "Job Costing & Margin calculation", `Job #: ${jobData?.job_no} (Margin: ${jobData?.gross_margin_percent}%)`);
    }

    // 9D: Field Engineer Commission Calculation
    const testComm = {
      engineer_name: "Engr. Sunday Okon",
      engineer_phone: "+2348123456781",
      work_order_no: "WO-2608-9999",
      system_size_kwp: 10.0,
      commission_rate_per_kwp: 15000,
      commission_amount: 150000,
      bonus_amount: 30000,
      total_payout: 180000,
      status: "approved",
    };
    const { data: commData, error: commErr } = await supabase.from("engineer_commissions").insert([testComm]).select().single();
    if (commErr) {
      assert(false, "Field Engineer Commission calculation", commErr.message);
    } else {
      assert(true, "Field Engineer Commission calculation", `Payout: ₦${Number(commData?.total_payout).toLocaleString()} for ${commData?.engineer_name}`);
    }
  } catch (err) {
    assert(false, "ERP Phase 3 exception", err.message);
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
