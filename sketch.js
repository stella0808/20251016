// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// -----------------------------------------------------------------
// 新增：煙火特效所需的全域變數
// -----------------------------------------------------------------
let fireworks = []; // 儲存所有煙火和爆炸粒子


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 當使用動畫 (如煙火) 時，需要啟用 loop() 或移除 noLoop()
    // 為了讓煙火動起來，移除 noLoop()，讓 draw() 持續執行
    // noLoop(); // 移除此行
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 清除背景時帶一點透明度，產生殘影效果 (Trails)
    background(255, 30); // 清除背景

    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // -------------------------------------------------------------
        // **新增** 90分以上：啟動煙火特效
        // -------------------------------------------------------------
        if (random(1) < 0.05) { // 大約每 20 幀發射一個煙火
             fireworks.push(new Firework()); 
        }

        // -------------------------------------------------------------
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // **新增**：更新和渲染煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        if (fireworks[i].done()) {
            // 移除已結束的煙火
            fireworks.splice(i, 1);
        }
    }
}


// =================================================================
// 步驟三：定義煙火和粒子類別 (Particle System)
// -----------------------------------------------------------------

// 粒子類別：用於爆炸後的碎片
class Particle {
    constructor(x, y, hue, firework = false) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否為發射中的主體
        this.lifespan = 255;
        this.hue = hue;
        
        if (this.firework) {
            // 主體粒子向上移動
            this.vel = createVector(0, random(-10, -18)); 
            this.acc = createVector(0, 0);
        } else {
            // 爆炸碎片向隨機方向散開
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
            this.acc = createVector(0, 0); // 之後會應用重力
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸碎片會受到重力和空氣阻力
            this.vel.mult(0.9); // 阻力
            this.lifespan -= 4; // 減少生命值 (透明度)
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            // 爆炸碎片
            strokeWeight(2);
            stroke(this.hue, 255, 255, this.lifespan);
        } else {
            // 主體粒子
            strokeWeight(4);
            stroke(this.hue, 255, 255);
        }
        point(this.pos.x, this.pos.y);
        colorMode(RGB); // 恢復預設顏色模式
    }
    
    done() {
        return this.lifespan < 0;
    }
}

// 煙火類別：管理發射、爆炸
class Firework {
    constructor() {
        this.pos_x = random(width * 0.2, width * 0.8); // 隨機 X 位置
        this.hue = random(255); // 隨機顏色
        
        // 建立主體粒子 (火箭)
        this.rocket = new Particle(this.pos_x, height, this.hue, true); 
        this.exploded = false;
        this.particles = []; // 爆炸碎片陣列
    }

    update() {
        if (!this.exploded) {
            this.rocket.applyForce(createVector(0, 0.2)); // 模擬重力
            this.rocket.update();
            
            // 模擬爆炸條件：到達隨機高度
            if (this.rocket.vel.y >= 0) {
                 this.explode();
                 this.exploded = true;
            }
        }
        
        // 更新碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(createVector(0, 0.15)); // 碎片受重力影響
            this.particles[i].update();
        }
        
        // 移除已結束的碎片 (在 show() 之後處理更佳，但為簡化放在這裡)
        this.particles = this.particles.filter(p => !p.done());
    }

    explode() {
        // 產生大量碎片
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.rocket.pos.x, this.rocket.pos.y, this.hue);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.rocket.show();
        }
        
        // 顯示碎片
        for (let particle of this.particles) {
            particle.show();
        }
    }

    done() {
        // 如果已爆炸且碎片都消失，則煙火結束
        return this.exploded && this.particles.length === 0;
    }
}
