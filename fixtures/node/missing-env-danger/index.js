if (!process.env.API_KEY && process.env.REQUIRE_REAL_ENV) {
  process.exit(1);
}
console.log('ok');
