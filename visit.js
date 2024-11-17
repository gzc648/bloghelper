const puppeteer = require('puppeteer');

const urls = [
    'https://www.gzcrtw.com/article/%E7%A7%91%E6%8A%80%E5%8F%B2%E7%BA%B2/',
    'https://www.gzcrtw.com/article/%E7%B2%BE%E5%8A%9B%E7%AE%A1%E7%90%86/',
    'https://www.gzcrtw.com/article/%E7%AC%94%E8%AE%B0%EF%BC%88%E6%9C%AA%E5%88%86%E7%B1%BB%EF%BC%89/',
    'https://www.gzcrtw.com/article/%E6%8A%91%E9%83%81%E7%97%87/',
    'https://www.gzcrtw.com/article/%E8%AE%A4%E7%9F%A5%E5%8F%91%E5%B1%95/',
    'https://gzcrtw.com/'
];

// 随机等待时间函数（60-180秒之间）
const randomWait = () => Math.floor(Math.random() * (180 - 60 + 1) + 60) * 1000;

// 随机打乱数组顺序
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function visitPages() {
    console.log('Starting browser...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 设置视窗大小
        await page.setViewport({ width: 1920, height: 1080 });
        
        // 设置 User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // 随机打乱访问顺序
        const shuffledUrls = shuffleArray([...urls]);
        
        for (const url of shuffledUrls) {
            console.log(`Visiting ${url}`);
            
            try {
                // 访问页面
                await page.goto(url, { 
                    waitUntil: 'networkidle0', 
                    timeout: 30000 
                });
                
                // 随机滚动页面
                await page.evaluate(() => {
                    return new Promise((resolve) => {
                        const scrollInterval = setInterval(() => {
                            window.scrollBy(0, Math.floor(Math.random() * 100));
                            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight) {
                                clearInterval(scrollInterval);
                                resolve();
                            }
                        }, 1000);
                    });
                });
                
                // 随机等待
                const waitTime = randomWait();
                console.log(`Waiting for ${waitTime/1000} seconds...`);
                await delay(waitTime);
                
            } catch (error) {
                console.error(`Error visiting ${url}:`, error.message);
                // 如果发生错误，等待短暂时间后继续
                await delay(5000);
                continue;
            }
        }
    } catch (error) {
        console.error('Browser error:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
}

// 运行脚本
visitPages().catch(console.error);
