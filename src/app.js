App({
  async onLaunch() {
    await new Promise(resolve => setTimeout(resolve, 1100));
    console.log(1);
  }
});
