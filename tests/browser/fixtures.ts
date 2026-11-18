import {test as base} from '@playwright/test';
export {expect,type Page} from '@playwright/test';
// CI is a software-rendered Linux machine; exercise the supported Low preset.
// Local hardware tests retain the default Auto preset and all three engines.
export const test=base.extend({page:async({page},use)=>{if(process.env.CI)await page.addInitScript(()=>{try{localStorage.setItem('ripple-graphics','low');}catch{}});await use(page);}});
