import dotenv from "dotenv";

dotenv.config();

const URL = process.env.URL;
const delay = async (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
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
        if (!username) {
            await myBot.sendMessage(id, "mohon mengisi username anda");
            return true;
        }
        if (!password) {
            await myBot.sendMessage(id, "mohon mengisi password anda");
            return true;
        }
        if (!email) {
            await myBot.sendMessage(id, "mohon mengisi email anda");
            return true;
        }
        if (!no_tlp) {
            await myBot.sendMessage(id, "mohon mengisi nomor telepon anda");
            return true;
        }
        if (!nama) {
            await myBot.sendMessage(id, "mohon mengisi nama anda");
            return true;
        }
        if (!jenis_bank) {
            await myBot.sendMessage(id, "mohon mengisi janis bank anda");
            return true;
        }
        if (!bank) {
            await myBot.sendMessage(id, "mohon mengisi nama bank anda");
            return true;
        }
        if (!rek) {
            await myBot.sendMessage(id, "mohon mengisi nomor rekening anda");
            return true;
        }

        await page.goto(`${URL}/register`);

        console.log(data[1]);
        await page.type('#user_name', username);
        await page.type('#password_1', password);
        await page.type('#password_confirm', password);
        await page.type('#email', email);
        await page.type('#mobile_no', no_tlp);
        await page.click("#register_form_two_next_btn > button");
        await page.waitForSelector("#register_form_two_submit_btn > button", {
            visible: true,
            timeout: 2000,
        });
        await delay(500);

        await page.type('#name1', nama);
        if (jenis_bank.toLowerCase() === "wallet") {
            await page.click("#registerForm1 > div.register_form_two > div:nth-child(4) > div.col-md-7 > div > div:nth-child(2) > label > span.radio-title");
            await page.select("#ewalletOpts--register", bank.toUpperCase());
        } else {
            await page.select("#bankOpts--register", bank.toUpperCase());
        }
        await page.type("#acc_no", rek); // isi no rek
        await page.click("#registerForm1 > div.register_form_two > div.form-group.form-check.submit-box > div:nth-child(1) > div > label");
        await page.click("#registerForm1 > div.register_form_two > div.form-group.form-check.submit-box > div:nth-child(2) > div > label");

        const element = await page.$("#registerForm1 > div.register_form_two > div.form-group.row.no-gutters > img");
        await element.screenshot({path: "src/image/test.png"});
        await myBot.sendPhoto(id, "src/image/test.png", {caption: "Isi CAPTCHA ini"}, {filename: "captcha.png"});
        return false;
    } catch (e) {
        await myBot.sendMessage(id, "Data yang dimasukkan salah, silahkan mengulangi registrasi!");
        return true;
    }
};

const verify = async (myBot, page, data) => {
    let [id, number, username, password] = data[0];
    try {
        await page.type("#captcha", number);
        await page.click("#register_form_two_submit_btn > button");
        await page.waitForSelector("body > div.content.my01 > div > div > div > div.centered-container > a > button", {
            visible: true,
            timeout: 3000,
        });
        await myBot.sendMessage(id, `registrasi berhasil\nUsername: ${username}\nPassword: ${password}`);
    } catch (e) {
        await myBot.sendMessage(id, "error, silahkan mengulangi registrasi!");
    }
    await page.close();
};

export default {
    formatter,
    register,
    verify,
};