const puppeteer = require('puppeteer');

const urls = [
    // https://www.gzcrtw.com/article/金融市场/
    'https://www.gzcrtw.com/article/%E9%87%91%E8%9E%8D%E5%B8%82%E5%9C%BA/',
    'https://www.gzcrtw.com/article/%E7%A7%91%E6%8A%80%E5%8F%B2%E7%BA%B2/',
    'https://www.gzcrtw.com/article/%E7%B2%BE%E5%8A%9B%E7%AE%A1%E7%90%86/',
    'https://www.gzcrtw.com/article/%E7%AC%94%E8%AE%B0%EF%BC%88%E6%9C%AA%E5%88%86%E7%B1%BB%EF%BC%89/',
    'https://www.gzcrtw.com/article/%E6%8A%91%E9%83%81%E7%97%87/',
    'https://www.gzcrtw.com/article/%E8%AE%A4%E7%9F%A5%E5%8F%91%E5%B1%95/',
    'https://gzcrtw.com/',
    'https://www.gzcrtw.com/article/%E8%B0%88%E5%88%A4%E5%9F%BA%E7%A1%80/'
];

// 设置最大总运行时间（14分钟 = 840000毫秒）
const MAX_TOTAL_TIME = 840000;

// 随机等待时间函数（10秒到5分钟之间）
const randomWait = () => Math.floor(Math.random() * (300 - 10 + 1) + 10) * 1000;

// 随机选择1到urls.length个URLs
const selectRandomUrls = (urls) => {
    const shuffled = [...urls].sort(() => 0.5 - Math.random());
    const MIN_URLS = 1;
    const numberOfUrls = Math.floor(Math.random() * (urls.length - MIN_URLS + 1) + MIN_URLS);
    const selected = shuffled.slice(0, numberOfUrls);
    console.log(`Randomly selected ${numberOfUrls} out of ${urls.length} total URLs`);
    return selected;
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 模拟真实的滚动行为
async function simulateScroll(page) {
    await page.evaluate(() => {
        return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            // 随机滚动速度
            const scrollInterval = Math.floor(Math.random() * (400 - 100 + 1) + 100);
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // 随机添加短暂暂停，模拟阅读
                if (Math.random() < 0.2) {
                    clearInterval(timer);
                    setTimeout(() => {
                        const newTimer = setInterval(() => {
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if(totalHeight >= scrollHeight) {
                                clearInterval(newTimer);
                                resolve();
                            }
                        }, scrollInterval);
                    }, Math.random() * 2000);
                }

                if(totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, scrollInterval);
        });
    });
}

async function visitPages() {
    const startTime = Date.now();
    console.log('Starting browser...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setJavaScriptEnabled(true);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });
        
        const selectedUrls = selectRandomUrls(urls);
        console.log('URLs to visit:');
        selectedUrls.forEach((url, index) => console.log(`${index + 1}. ${url}`));
        
        let totalVisitTime = 0;

        for (const url of selectedUrls) {
            try {
                if (Date.now() - startTime >= MAX_TOTAL_TIME) {
                    console.log('Maximum time reached, stopping visits');
                    break;
                }

                console.log(`\nVisiting ${url}`);
                
                const response = await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000 
                });

                if (!response || !response.ok()) {
                    throw new Error(`Failed to load ${url}: ${response?.status() || 'unknown error'}`);
                }

                await page.waitForSelector('body', { timeout: 5000 });
                
                // 模拟滚动和阅读行为
                await simulateScroll(page);
                
                const waitTime = randomWait();
                const waitTimeSeconds = Math.round(waitTime/1000);
                console.log(`Reading page for ${waitTimeSeconds} seconds...`);
                totalVisitTime += waitTimeSeconds;
                await delay(waitTime);
                
            } catch (error) {
                console.error(`Error visiting ${url}:`, error.message);
                await delay(5000);
            }
        }
        
    } catch (error) {
        console.error('Browser error:', error);
    } finally {
        await browser.close();
        const totalTime = (Date.now() - startTime) / 1000;
        console.log('\nVisit summary:');
        console.log('------------------------');
        console.log(`Total execution time: ${totalTime.toFixed(1)} seconds`);
        console.log(`Total reading time: ${totalVisitTime.toFixed(1)} seconds`);
        console.log('Browser closed successfully.');
    }
}

// 运行主函数
visitPages().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
