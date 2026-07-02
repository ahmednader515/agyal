-- PayPal and InstaPay payment methods for add-balance page
ALTER TABLE "HomepageSetting"
  ADD COLUMN IF NOT EXISTS add_balance_paypal_method_title TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_paypal_method_title_en TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_paypal_transfer_instruction TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_paypal_transfer_instruction_en TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_paypal_account TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_instapay_method_title TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_instapay_method_title_en TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_instapay_transfer_instruction TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_instapay_transfer_instruction_en TEXT,
  ADD COLUMN IF NOT EXISTS add_balance_instapay_account TEXT;
