#!/usr/bin/env node
/**
 * Usage: npm run hash-password -- "YourNewPassword123!"
 *
 * Prints a bcrypt hash you can paste into .env.local as ADMIN_PASSWORD_HASH
 * to change the admin password without ever storing it in plain text.
 *
 * IMPORTANT: Next.js expands $VAR-style references in .env files, and
 * bcrypt hashes are full of dollar signs ($2a$12$...). This script prints
 * the hash already escaped (\$ instead of $) so it's safe to paste
 * directly into .env.local. Do not "fix" it by removing the backslashes.
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "YourNewPassword"');
  process.exit(1);
}

if (password.length < 10) {
  console.error("Please choose a password with at least 10 characters.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escaped = hash.replace(/\$/g, "\\$");

console.log("\nAdd this to your .env.local as ADMIN_PASSWORD_HASH (dollar signs pre-escaped):\n");
console.log(`ADMIN_PASSWORD_HASH=${escaped}`);
console.log("");
