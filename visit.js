const puppeteer = require('puppeteer');

const targetPages = [
    {
        url: 'https://www.gzcrtw.com/article/%E9%87%91%E8%9E%8D%E5%B8%82%E5%9C%BA/',
        searchQuery: '金融市场 gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E7%A7%91%E6%8A%80%E5%8F%B2%E7%BA%B2/',
        searchQuery: '科技史纲 gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E7%B2%BE%E5%8A%9B%E7%AE%A1%E7%90%86/',
        searchQuery: '精力管理 gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E7%AC%94%E8%AE%B0%EF%BC%88%E6%9C%AA%E5%88%86%E7%B1%BB%EF%BC%89/',
        searchQuery: '笔记 gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E6%8A%91%E9%83%81%E7%97%87/',
        searchQuery: '抑郁症 gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E8%AE%A4%E7%9F%A5%E5%8F%91%E5%B1%95/',
        searchQuery: '认知发展 gzcrtw'
    },
    {
        url: 'https://gzcrtw.com/',
        searchQuery: 'gzcrtw'
    },
    {
        url: 'https://www.gzcrtw.com/article/%E8%B0%88%E5%88%A4%E5%9F%BA%E7%A1%80/',
        searchQuery: '谈判基础 gzcrtw'
    }
];

const MAX_TOTAL_TIME = 840000;
const randomWait = () => Math.floor(Math.random() * (300 - 10 + 1) + 10) * 1000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const selectRandomPages = (pages) => {
    const shuffled = [...pages].sort(() => 0.5 - Math.random());
    const MIN_PAGES = 1;
    const numberOfPages = Math.floor(Math.random() * (pages.length - MIN_PAGES + 1) + MIN_PAGES);
    const selected = shuffled.slice(0, numberOfPages);
    console.log(`Randomly selected ${numberOfPages} out of ${pages.length} total pages`);
    return selected;
};

async function simulateScroll(page) {
    await page.evaluate(() => {
        return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const scrollInterval = Math.floor(Math.random() * (400 - 100 + 1) + 100);
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

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

async function searchAndVisit() {
    const startTime = Date.now();
    let totalVisitTime = 0;  // 移到函数开头
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
        
        const selectedPages = selectRandomPages(targetPages);
        console.log('Pages to visit:');
        selectedPages.forEach((page, index) => console.log(`${index + 1}. Search: ${page.searchQuery} -> ${page.url}`));
        
        for (const targetPage of selectedPages) {
            try {
                if (Date.now() - startTime >= MAX_TOTAL_TIME) {
                    console.log('Maximum time reached, stopping visits');
                    break;
                }

                console.log(`\nSearching Google for: ${targetPage.searchQuery}`);
                await page.goto('https://www.google.com/search?q=' + encodeURIComponent(targetPage.searchQuery), {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                await delay(Math.random() * 5000 + 2000);

                // 修改查找和点击链接的逻辑
                const targetUrl = targetPage.url.replace('https://', '');
                const found = await page.evaluate(async (targetUrl) => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const targetLink = links.find(link => link.href.includes(targetUrl));
                    if (targetLink) {
                        targetLink.click();
                        return true;
                    }
                    return false;
                }, targetUrl);

                if (found) {
                    console.log('Found and clicked target link');
                    
                    // 等待新页面加载
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });

                    const currentUrl = page.url();
                    if (currentUrl.includes('gzcrtw.com')) {
                        console.log('Successfully navigated to target page');
                        
                        await page.waitForSelector('body', { timeout: 5000 });
                        await simulateScroll(page);
                        
                        const waitTime = randomWait();
                        const waitTimeSeconds = Math.round(waitTime/1000);
                        console.log(`Reading page for ${waitTimeSeconds} seconds...`);
                        totalVisitTime += waitTimeSeconds;
                        await delay(waitTime);
                    } else {
                        console.log('Navigation led to unexpected URL:', currentUrl);
                    }
                } else {
                    console.log('Target link not found in search results');
                    // 如果在搜索结果中找不到链接，直接访问目标URL
                    console.log('Directly visiting target URL');
                    await page.goto(targetPage.url, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });
                    await simulateScroll(page);
                    const waitTime = randomWait();
                    const waitTimeSeconds = Math.round(waitTime/1000);
                    console.log(`Reading page for ${waitTimeSeconds} seconds...`);
                    totalVisitTime += waitTimeSeconds;
                    await delay(waitTime);
                }
                
                await delay(Math.random() * 10000 + 5000);
                
            } catch (error) {
                console.error(`Error processing ${targetPage.url}:`, error.message);
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

searchAndVisit().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
