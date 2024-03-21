import dotenv from "dotenv";
import myRedis from "./my-redis.js";
import {myBot} from "./main.js";

dotenv.config();

const URL = process.env.URL;

const delay = async (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const remove = async (id, msgID) => {
    await myBot.deleteMessage(id, msgID);
};

const addMessage = async (data) => {
    const id = data.chat.id.toString();
    const msgID = data.message_id.toString();
    const timestamp = data.date.toString();
    await myRedis.setData(id, msgID, timestamp);
};

const formatter = (id, data) => {
    const abs = ["username", "password", "email", "no tlp", "nama", "jenis bank", "bank", "rek"];
    let val = [];
    data = data.split("\n");
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < abs.length; j++) {
            if (data[i].split(":")[0].toLowerCase().includes(abs[j])) {
                val.push(data[i].split(":")[1].trim());
                break;
            }
        }
    }
    return [id, val];
};

const register = async (myBot, page, data) => {
    let id = data[0];
    let [username, password, email, no_tlp, nama, jenis_bank, bank, rek] = data[1];
    try {
        await page.goto(`${URL}/register`);
        await page.type('#user_name', username);
        await page.type('#password_1', password);
        await page.type('#password_confirm', password);
        await page.type('#email', email);
        await page.type('#mobile_no', no_tlp);
        await page.focus("#refCodeInput");
        await delay(100);
        if ((await page.$eval('#user_name', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "username tidak valid, gunakan username yang sesuai"), page);
            return true;
        }
        if ((await page.$eval('#password_1', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "password tidak valid, gunakan password yang sesuai"), page);
            return true;
        }
        if ((await page.$eval('#email', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "email tidak valid, gunakan email yang sesuai"), page);
            return true;
        }
        if ((await page.$eval('#mobile_no', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "nomor telpon tidak valid, gunakan nomor telpon yang sesuai"), page);
            return true;
        }

        await page.click("#register_form_two_next_btn > button");
        await delay(100);
        await page.waitForSelector("#register_form_two_submit_btn > button", {
            visible: true,
            timeout: 2000,
        });

        await page.type('#name1', nama);
        if (jenis_bank.toLowerCase() === "wallet") {
            await page.click("#registerForm1 > div.register_form_two > div:nth-child(4) > div.col-md-7 > div > div:nth-child(2) > label > span.radio-title");
            await page.select("#ewalletOpts--register", bank.toUpperCase());
        } else {
            await page.select("#bankOpts--register", bank.toUpperCase());
        }
        await page.type("#acc_no", rek); // isi no rek
        await page.focus("#captcha");
        await delay(100);

        await page.evaluate(() => document.querySelector("#terms").checked = true);
        await page.evaluate(() => document.querySelector("#RememberMe").checked = false);

        if ((await page.$eval('#name1', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "nama tidak valid, gunakan nama yang sesuai"), page);
            return true;
        }
        if ((await page.$eval('#acc_no', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "nomor rekening tidak valid, gunakan nomor rekening yang sesuai"), page);
            return true;
        }
        const element = await page.$("#registerForm1 > div.register_form_two > div.form-group.row.no-gutters > img");
        await element.screenshot({path: "src/image/test.png"});
        await addMessage(await myBot.sendPhoto(id, "src/image/test.png", {caption: "Isi CAPTCHA ini"}, {filename: "captcha.png"}));
        return false;
    } catch (e) {
        const element2 = await page.$("body > div.content.my01 > div > div > div.col-md-8.clearfix");
        await element2.screenshot({path: "src/image/test2.png"});
        await addMessage(await myBot.sendPhoto(id, "src/image/test2.png", {caption: "Data yang dimasukkan salah, silahkan mengulangi registrasi"}, {filename: "error.png"}));
        return true;
    }
};

const verify = async (myBot, page, data) => {
    let [id, number, username, password] = data;
    try {
        await page.evaluate(() => document.querySelector("#captcha").value = "");
        await page.type("#captcha", number);
        await page.focus("#register_form_two_submit_btn > button");
        await delay(100);

        if ((await page.$eval('#captcha', element => element.getAttribute("class"))).includes("has-error")) {
            await addMessage(await myBot.sendMessage(id, "captcha salah silahkan diulangi"), page);
            await page.click("#registerForm1 > div.register_form_two > div.form-group.row.no-gutters > button");
            return true;
        }

        await page.evaluate(() => document.querySelector("#register_form_two_submit_btn > button").click());
        await page.waitForSelector("body > div.content.my01 > div > div > div > div.centered-container > a > button", {
            visible: true,
            timeout: 3000,
        });
        await addMessage(await myBot.sendMessage(id, `registrasi berhasil\nUsername: ${username}\nPassword: ${password}`));

        await myRedis.increaseCounter();
        await page.close();
        return false;
    } catch (e) {
        const element = await page.$("body > div.content.my01 > div > div > div.col-md-8.clearfix");
        await element.screenshot({path: "src/image/test3.png"});
        await addMessage(await myBot.sendPhoto(id, "src/image/test3.png", {caption: "error, silahkan mengulangi registrasi!"}, {filename: "error.png"}));
        return false;
    }
};

export default {
    remove,
    formatter,
    register,
    verify,
    addMessage,
};