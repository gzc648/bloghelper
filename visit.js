const puppeteer = require('puppeteer');

const urls = [
    // 在注释中保留中文URL便于理解，实际使用编码后的URL
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

// 随机等待时间函数（30-60秒之间）
const randomWait = () => Math.floor(Math.random() * (60 - 30 + 1) + 30) * 1000;

// 随机选择URLs
const selectRandomUrls = (urls, maxTimeInMs) => {
    const shuffled = [...urls].sort(() => 0.5 - Math.random());
    const selected = [];
    let estimatedTime = 0;
    const averageVisitTime = 45000; // 假设平均每个页面访问45秒

    for (const url of shuffled) {
        const estimatedNextVisit = averageVisitTime;
        if (estimatedTime + estimatedNextVisit < maxTimeInMs) {
            selected.push(url);
            estimatedTime += estimatedNextVisit;
        } else {
            break;
        }
    }
    
    return selected;
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function simulateScroll(page) {
    await page.evaluate(() => {
        return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200); // 加快滚动速度
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
        
        // 选择要访问的URLs
        const selectedUrls = selectRandomUrls(urls, MAX_TOTAL_TIME);
        console.log(`Selected ${selectedUrls.length} URLs to visit`);
        
        for (const url of selectedUrls) {
            try {
                // 检查是否超时
                if (Date.now() - startTime >= MAX_TOTAL_TIME) {
                    console.log('Maximum time reached, stopping visits');
                    break;
                }

                console.log(`Visiting ${url}`);
                
                const response = await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000 
                });

                if (!response || !response.ok()) {
                    throw new Error(`Failed to load ${url}: ${response?.status() || 'unknown error'}`);
                }

                await page.waitForSelector('body', { timeout: 5000 });
                await simulateScroll(page);
                
                const waitTime = randomWait();
                console.log(`Staying on page for ${Math.round(waitTime/1000)} seconds...`);
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
        console.log('Browser closed successfully.');
        console.log(`Total execution time: ${(Date.now() - startTime) / 1000} seconds`);
    }
}

// 运行主函数
visitPages().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
