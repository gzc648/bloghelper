const puppeteer = require('puppeteer');

const targetPages = [
    {
        url: 'https://www.gzcrtw.com/article/financial%20market',
        searchQuery: 'financial market gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/Outline%20of%20the%20history%20of%20science%20and%20technology',
        searchQuery: 'Outline of the history of science and technology gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/Energetic%20management',
        searchQuery: 'Energetic management gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/Notes%20(unclassified)',
        searchQuery: 'Notes (unclassified) gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/Negotiation%20Basics',
        searchQuery: 'clinical depression gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/cognitive%20development',
        searchQuery: 'cognitive development gzcrtw Blog'
    },
    {
        url: 'https://gzcrtw.com/',
        searchQuery: 'gzcrtw Blog'
    },
    {
        url: 'https://www.gzcrtw.com/article/Negotiation%20Basics',
        searchQuery: 'Negotiation Basics gzcrtw Blog'
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

async function findAndClickLink(page, targetUrl) {
    // 尝试多种选择器来定位链接
    const selectors = [
        'div.g a[href*="gzcrtw.com"]',  // 标准搜索结果
        'div[role="main"] a[href*="gzcrtw.com"]',  // 另一种可能的结构
        'a[href*="gzcrtw.com"]'  // 最宽泛的选择器
    ];

    for (const selector of selectors) {
        try {
            const links = await page.$$(selector);
            console.log(`Found ${links.length} links matching selector: ${selector}`);
            
            for (const link of links) {
                const href = await page.evaluate(el => el.href, link);
                console.log(`Checking link: ${href}`);
                
                if (href.includes(targetUrl.replace('https://', ''))) {
                    console.log(`Found matching link: ${href}`);
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
                        link.click()
                    ]);
                    return true;
                }
            }
        } catch (error) {
            console.log(`Error with selector ${selector}:`, error.message);
        }
    }
    return false;
}

async function searchAndVisit() {
    const startTime = Date.now();
    let totalVisitTime = 0;
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
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',  // 添加中文语言支持
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
                await page.goto(`https://www.google.com/search?q=${encodeURIComponent(targetPage.searchQuery)}&hl=zh-CN`, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                // 等待搜索结果加载并展示一些调试信息
                await delay(Math.random() * 5000 + 3000);
                const pageContent = await page.content();
                console.log(`Page title: ${await page.title()}`);
                console.log('Search page loaded, length:', pageContent.length);

                const found = await findAndClickLink(page, targetPage.url);

                if (found) {
                    console.log('Successfully navigated through search result');
                    await simulateScroll(page);
                    
                    const waitTime = randomWait();
                    const waitTimeSeconds = Math.round(waitTime/1000);
                    console.log(`Reading page for ${waitTimeSeconds} seconds...`);
                    totalVisitTime += waitTimeSeconds;
                    await delay(waitTime);
                } else {
                    console.log('Could not find link in search results, visiting directly');
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
                
                // 在访问下一个页面前等待随机时间
                const cooldownTime = Math.floor(Math.random() * 15000 + 10000);
                console.log(`Cooling down for ${Math.round(cooldownTime/1000)} seconds...`);
                await delay(cooldownTime);
                
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
