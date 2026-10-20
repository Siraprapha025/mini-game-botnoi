// Mock story: 10 scenes whose text and choices react to earlier answers.
import type { AnswerRecord, CharacterPlacement, Choice, GameState, LocationId, Scene } from "./types";

export const TOTAL_QUESTIONS = 10;

type Ctx = { s: GameState; has: (f: string) => boolean; name: string; history: AnswerRecord[] };
type Def = (c: Ctx) => {
  location: LocationId;
  characters: CharacterPlacement[];
  title: string;
  paragraphs: string[];
  question: string;
  choices: Choice[];
};

const P = (x = 22, flip = false): CharacterPlacement => ({ id: "player", x, height: 46, flip });

const scenes: Def[] = [
  // 1
  ({ name }) => ({
    location: "apple-tree",
    characters: [P(30)],
    title: "บ่ายสบาย ๆ ใต้ต้นแอปเปิ้ล",
    paragraphs: [
      `${name} หมาป่าสีเทาธรรมดา ๆ กำลังนั่งเคี้ยวแอปเปิ้ลลูกที่สามอย่างมีความสุข ลมเย็นพัดใบไม้ไหวเบา ๆ`,
      "จู่ ๆ ก็ได้ยินเสียงทุ้มนุ่มเกินจริงดังมาจากหลังพุ่มไม้ “หนูน้อยจ๋า บ้านคุณยายไปทางไหนจ๊ะ?” เสียงนั้นคุ้นหูแบบไม่น่าไว้ใจเลย",
    ],
    question: "คุณจะทำอย่างไรต่อ?",
    choices: [
      { id: "s1-eat", label: "กัดแอปเปิ้ลต่อ ทำเป็นไม่ได้ยิน", effects: { withdraw: 1 }, memory: "เลือกกัดแอปเปิ้ลต่ออย่างใจเย็น" },
      { id: "s1-follow", label: "ย่องตามไปดูเงียบ ๆ", effects: { help: 1, flags: ["followed"] }, memory: "ย่องตามไปดูตั้งแต่ต้น" },
      { id: "s1-greet", label: "เดินออกไปทักทายทั้งสองตรง ๆ", effects: { trust: 1, witnesses: ["red"], flags: ["metRed"] }, memory: "เดินออกไปทักหนูน้อยตรง ๆ" },
    ],
  }),
  // 2
  ({ has }) => ({
    location: "crossroads",
    characters: [{ id: "villain", x: 70, height: 50 }, P(25)],
    title: "ทางแยกสามป้าย",
    paragraphs: [
      has("metRed")
        ? "หนูน้อยหมวกแดงยิ้มโบกมือให้คุณก่อนเดินไปทางทุ่งหญ้า ส่วนหมาป่าตัวร้ายมองคุณด้วยหางตาแปลก ๆ"
        : has("followed")
          ? "คุณหลบอยู่หลังต้นไม้ เห็นหมาป่าตัวร้ายชี้ให้หนูน้อยไปทางทุ่งหญ้า ทั้งที่ป้ายเขียนชัดว่ากระท่อมยายอยู่อีกทาง"
          : "แอปเปิ้ลหมดพอดี คุณเดินมาถึงทางแยกและเห็นหมาป่าตัวร้ายยืนยิ้มกริ่มอยู่ใต้ป้าย ป่าลึก / กระท่อมยาย / ทุ่งหญ้า",
      "หมาป่าตัวร้ายกำลังจะวิ่งไปทางกระท่อมยาย",
    ],
    question: "ตรงทางแยกนี้ คุณเลือกอะไร?",
    choices: [
      { id: "s2-ask", label: "ทักหมาป่าตัวร้ายว่า “รีบไปไหนน่ะ?”", effects: { villainAlly: 1, flags: ["talkVillain"] }, memory: "ชวนหมาป่าตัวร้ายคุยตรงทางแยก" },
      { id: "s2-meadow", label: "เลี้ยวไปทุ่งหญ้า เก็บดอกไม้ฆ่าเวลา", effects: { withdraw: 1 } , memory: "เลี้ยวไปเก็บดอกไม้ในทุ่งหญ้า"},
      { id: "s2-warn", label: "วิ่งไปบอกหนูน้อยว่าป้ายถูกชี้ผิด", effects: { help: 1, witnesses: ["red"], flags: ["redWarned"] }, memory: "วิ่งไปเตือนหนูน้อยเรื่องป้ายที่ถูกชี้ผิด" },
    ],
  }),
  // 3
  ({ has }) => ({
    location: "deep-forest",
    characters: [{ id: "villain", x: 68, height: 50 }, P(28)],
    title: "ข้อเสนอในป่าทึบ",
    paragraphs: [
      has("redWarned")
        ? "หมาป่าตัวร้ายดักรอคุณกลางทาง “นายไปพูดอะไรกับเด็กนั่น” มันบ่นอุบ แล้วรีบเปลี่ยนเป็นยิ้มหวาน"
        : "หมาป่าตัวร้ายเดินมาตีคู่คุณบนทางเดินป่าทึบ กลิ่นขนมอบลอยออกมาจากความคิดของมันแทบจะมองเห็นได้",
      "“ในตะกร้าของเด็กนั่นมีพายเบอร์รี่นะ ไปช่วยกันหน่อยไหม แบ่งกันคนละครึ่ง”",
    ],
    question: "คุณตอบข้อเสนอนี้ว่าอย่างไร?",
    choices: [
      { id: "s3-fake", label: "แกล้งตอบตกลง แต่แอบวางแผนขัดขวาง", effects: { help: 1, flags: ["doubleAgent"] }, memory: "แกล้งรับข้อเสนอเพื่อแอบขัดขวาง" },
      { id: "s3-no", label: "ส่ายหัวแล้วเดินแยกไปอีกทาง", effects: { withdraw: 1 }, memory: "ปฏิเสธพายแล้วเดินแยกไป" },
      { id: "s3-join", label: "“พายเบอร์รี่เหรอ... ก็น่าสนใจนะ”", effects: { villainAlly: 2, flags: ["plotJoin"] }, memory: "ยอมรับแผนพายเบอร์รี่" },
    ],
  }),
  // 4
  ({ has }) => ({
    location: "deep-forest",
    characters: [{ id: "huntsman", x: 72, height: 54 }, P(26)],
    title: "นายพรานผู้ช่างสังเกต",
    paragraphs: [
      "เสียงกิ่งไม้หักดังกร๊อบ นายพรานโผล่ออกมาจากพุ่มไม้พร้อมแว่นขยายอันใหญ่",
      has("plotJoin")
        ? "“เมื่อกี้เห็นหมาป่าสองตัวกระซิบกระซาบกันแถวนี้ ใช่เจ้าหรือเปล่า?” เขาหรี่ตามองคุณ"
        : "“มีใครเห็นหมาป่าขนสีเข้มผ่านมาแถวนี้ไหม มีคนแจ้งว่ามันชอบหลอกเด็ก”",
    ],
    question: "คุณจะพูดอะไรกับนายพราน?",
    choices: [
      { id: "s4-tell", label: "เล่าทุกอย่างที่เห็นให้นายพรานฟัง", effects: { help: 1, trust: 1, witnesses: ["huntsman"], flags: ["huntsmanAlerted"] }, memory: "เล่าความจริงให้นายพรานฟัง" },
      { id: "s4-hide", label: "กระโดดหลบหลังพุ่มไม้แบบลน ๆ", effects: { suspicion: 2, flags: ["hidBush"] }, memory: "กระโดดหลบนายพรานแบบลน ๆ" },
      has("plotJoin")
        ? { id: "s4-cover", label: "ปิดปากเงียบ ช่วยปกปิดให้เพื่อนร่วมแผน", effects: { villainAlly: 1, suspicion: 1 }, memory: "ปิดปากเงียบเพื่อเพื่อนร่วมแผน" }
        : { id: "s4-shrug", label: "ยักไหล่ “ผมแค่มาหาแอปเปิ้ลครับ”", effects: { withdraw: 1 }, memory: "บอกนายพรานว่าแค่มาหาแอปเปิ้ล" },
    ],
  }),
  // 5
  ({ has }) => ({
    location: "grandma-house",
    characters: [{ id: "villain", x: 62, height: 46 }, P(20)],
    title: "เสียงเคาะประตูหน้าบ้านคุณยาย",
    paragraphs: [
      "กระท่อมหลังคามุงฟางเงียบสงบ มีกองฟืนเรียงเป็นระเบียบ หมาป่าตัวร้ายยืนดัดเสียงเล็กแหลมอยู่หน้าประตู “ยายจ๋า หลานมาแล้วจ้า”",
      has("huntsmanAlerted") ? "ไกล ๆ ได้ยินเสียงฝีเท้านายพรานกำลังตามมา แต่ยังอีกพักใหญ่" : "รอบตัวไม่มีใครเลยนอกจากคุณ",
    ],
    question: "ตอนนี้คุณจะทำอะไร?",
    choices: [
      { id: "s5-throw", label: "โยนแอปเปิ้ลไปไกล ๆ ให้ตัวร้ายหันไปดู", effects: { help: 1, flags: ["distract"] }, memory: "โยนแอปเปิ้ลหลอกให้ตัวร้ายหันไปทางอื่น" },
      { id: "s5-bush", label: "นั่งยอง ๆ ดูอยู่ในพุ่มไม้ข้างบ้าน", effects: { withdraw: 1, suspicion: 1 }, memory: "นั่งดูเงียบ ๆ จากพุ่มไม้ข้างบ้าน" },
      { id: "s5-lookout", label: "ช่วยดูต้นทางให้หมาป่าตัวร้าย", effects: { villainAlly: 1, flags: ["lookout"] }, memory: "อาสาดูต้นทางให้หมาป่าตัวร้าย" },
    ],
  }),
  // 6
  ({ s, has }) => ({
    location: "grandma-house",
    characters: [{ id: "grandma", x: 70, height: 48 }, P(24)],
    title: "คุณยายที่หน้าต่างหลังบ้าน",
    paragraphs: [
      has("distract")
        ? "ระหว่างที่หมาป่าตัวร้ายวิ่งตามแอปเปิ้ล คุณยายแง้มหน้าต่างหลังบ้านออกมาดูว่าเกิดอะไรขึ้น"
        : "คุณยายเปิดหน้าต่างหลังบ้านมารดน้ำต้นไม้ ไม่รู้เลยว่าหน้าบ้านมีแขกไม่ได้รับเชิญ",
      "“อ้าว หมาป่าสีเทา มาทำอะไรแถวนี้จ๊ะ?” คุณยายถามพร้อมขยับแว่น",
    ],
    question: "คุณจะบอกคุณยายว่าอะไร?",
    choices:
      s.villainAlly >= 2
        ? [
            { id: "s6-lure", label: "ชวนคุณยายออกไปเก็บเห็ดในป่า ให้บ้านว่าง", effects: { villainAlly: 1, safe: ["grandma"], flags: ["grandmaLured"] }, memory: "ชวนคุณยายไปเก็บเห็ดให้บ้านว่าง" },
            { id: "s6-escape", label: "กระซิบให้คุณยายหนีทางหลังบ้านเดี๋ยวนี้", effects: { help: 2, villainAlly: -1, safe: ["grandma"], witnesses: ["grandma"], flags: ["grandmaEscaped"] }, memory: "พาคุณยายหนีทางหลังบ้าน" },
            { id: "s6-leave", label: "โบกมือทักแล้วเดินกลับไปที่ต้นแอปเปิ้ล", effects: { withdraw: 2 }, memory: "โบกมือลาแล้วกลับไปที่ต้นแอปเปิ้ล" },
          ]
        : [
            { id: "s6-warn", label: "เคาะกระจกเตือน แล้วรีบวิ่งหลบไป", effects: { help: 1, safe: ["grandma"], flags: ["grandmaWarned"] }, memory: "เคาะกระจกเตือนคุณยายแล้ววิ่งหลบ" },
            { id: "s6-leave", label: "โบกมือทักแล้วเดินกลับไปที่ต้นแอปเปิ้ล", effects: { withdraw: 2 }, memory: "โบกมือลาแล้วกลับไปที่ต้นแอปเปิ้ล" },
            { id: "s6-escape", label: "กระซิบให้คุณยายหนีทางหลังบ้านเดี๋ยวนี้", effects: { help: 2, safe: ["grandma"], witnesses: ["grandma"], flags: ["grandmaEscaped"] }, memory: "พาคุณยายหนีทางหลังบ้าน" },
          ],
  }),
  // 7
  ({ s }) => ({
    location: "grandma-room",
    characters: [{ id: "villain", x: 66, height: 50, disguised: true }, P(22)],
    title: "คุณยายตัวปลอมบนเก้าอี้",
    paragraphs: [
      "ในห้องนั่งเล่นอบอุ่น เตาผิงปะทุเบา ๆ แมวสีส้มหลับอยู่บนพรม หมาป่าตัวร้ายคลุมผ้าห่มลายตารางนั่งบนเก้าอี้ ใส่หมวกนอนของยายแบบเบี้ยว ๆ",
      s.safe.includes("grandma")
        ? "คุณยายตัวจริงไม่อยู่บ้านแล้ว ห้องนี้จึงเหลือแค่คุณ ตัวร้าย และแมวส้มที่ไม่สนใจโลก"
        : "ไม่มีวี่แววคุณยายตัวจริงเลย คุณได้แต่หวังว่าท่านออกไปข้างนอก",
    ],
    question: "ก่อนหนูน้อยจะมาถึง คุณทำอะไร?",
    choices: [
      { id: "s7-blanket", label: "ช่วยจัดผ้าห่มให้ตัวร้ายดูเนียนขึ้น", effects: { villainAlly: 1 }, memory: "ช่วยจัดผ้าห่มให้คุณยายตัวปลอม" },
      { id: "s7-glasses", label: "แอบเอาแว่นของยายไปซ่อน ให้ตัวร้ายมองไม่ชัด", effects: { help: 1, flags: ["glassesHidden"] }, memory: "แอบซ่อนแว่นให้ตัวร้ายมองไม่ชัด" },
      { id: "s7-cat", label: "นั่งลูบแมวส้มข้างเตาผิงอย่างสงบ", effects: { withdraw: 1, suspicion: 1 }, memory: "นั่งลูบแมวส้มข้างเตาผิง" },
    ],
  }),
  // 8
  ({ has }) => ({
    location: "grandma-room",
    characters: [{ id: "red", x: 40, height: 46 }, { id: "villain", x: 74, height: 50, disguised: true }, P(14)],
    title: "ทำไมหูยายใหญ่จัง",
    paragraphs: [
      has("redWarned") || has("metRed")
        ? "หนูน้อยหมวกแดงเข้ามาพร้อมตะกร้าขนม เห็นคุณก็ทำหน้างง ๆ “อ้าว พี่หมาป่าสีเทานี่นา”"
        : "หนูน้อยหมวกแดงเปิดประตูเข้ามาพร้อมตะกร้าขนม ไม่ทันสังเกตว่ามีหมาป่าสีเทายืนอยู่ข้างตู้",
      `หนูน้อยมองคุณยายบนเก้าอี้ “ยายจ๋า ทำไมหูยายใหญ่จัง${has("glassesHidden") ? " แล้วทำไมยายหรี่ตาแบบนั้นล่ะ" : ""}?”`,
    ],
    question: "คุณจะทำอะไรในวินาทีนี้?",
    choices: [
      { id: "s8-window", label: "ค่อย ๆ ปีนออกทางหน้าต่าง", effects: { withdraw: 1, flags: ["slipWindow"] }, memory: "ปีนหน้าต่างออกไปก่อนเรื่องวุ่น" },
      { id: "s8-answer", label: "ตอบแทนยาย “หูใหญ่ไว้ฟังหลานไงจ๊ะ”", effects: { villainAlly: 1, suspicion: 1 }, memory: "ตอบแทนคุณยายตัวปลอมอย่างหน้าตาย" },
      { id: "s8-cough", label: "กระแอมเสียงดังแล้วส่งสายตาเตือนหนูน้อย", effects: { help: 1, safe: ["red"], witnesses: ["red"], flags: ["coughWarn"] }, memory: "กระแอมเตือนหนูน้อยทันเวลา" },
    ],
  }),
  // 9
  ({ has }) =>
    has("slipWindow")
      ? {
          location: "grandma-house",
          characters: [{ id: "huntsman", x: 70, height: 52 }, P(24)],
          title: "นอกหน้าต่าง",
          paragraphs: [
            "คุณลงมายืนข้างกองฟืน ในบ้านเริ่มมีเสียงโครมคราม นายพรานเดินมาตามทางพอดีและเห็นคุณยืนอยู่ใต้หน้าต่าง",
            "“เฮ้ เจ้าหมาป่า ทำไมมายืนลับ ๆ ล่อ ๆ ตรงนี้?”",
          ],
          question: "คุณจะตอบสนองอย่างไร?",
          choices: [
            { id: "s9-peek", label: "ทำเป็นไม่ได้ยิน แล้วแอบมองเข้าไปในบ้านต่อ", effects: { suspicion: 2 }, memory: "แอบมองผ่านหน้าต่างจนนายพรานสงสัย" },
            { id: "s9-run", label: "วิ่งกลับเข้าป่า ไม่อยากยุ่งแล้ว", effects: { withdraw: 2 }, memory: "วิ่งกลับป่าเมื่อเรื่องเริ่มวุ่น" },
            { id: "s9-call", label: "ชี้เข้าไปในบ้าน “ตัวร้ายอยู่ข้างใน รีบไปเร็ว!”", effects: { help: 1, safe: ["red"], witnesses: ["huntsman"], flags: ["pointedVillain"] }, memory: "พานายพรานไปหาตัวร้ายในบ้าน" },
          ],
        }
      : {
          location: "grandma-room",
          characters: [
            { id: "huntsman", x: 80, height: 52 },
            { id: "villain", x: 56, height: 48 },
            { id: "red", x: 34, height: 42 },
            P(12),
          ],
          title: "นายพรานบุกเข้ามา",
          paragraphs: [
            has("huntsmanAlerted")
              ? "ประตูเปิดผางตรงเวลาพอดี นายพรานที่คุณเล่าเรื่องไว้วิ่งเข้ามา “ไหนตัวร้าย!”"
              : "ประตูเปิดผาง นายพรานเดินเข้ามาเพราะได้ยินเสียงวุ่นวาย และเห็นหมาป่าถึงสองตัวในห้องเดียวกัน",
            "หมาป่าตัวร้ายสะบัดผ้าห่มทิ้ง หนูน้อยกอดตะกร้าแน่น ทุกสายตาหันมาที่คุณ",
          ],
          question: "คุณจะทำอะไร?",
          choices: [
            { id: "s9-point", label: "ชี้ไปที่หมาป่าตัวร้ายตัวจริง", effects: { help: 1, safe: ["red"], witnesses: ["huntsman", "red"], flags: ["pointedVillain"] }, memory: "ชี้ตัวหมาป่าตัวร้ายต่อหน้าทุกคน" },
            { id: "s9-grab", label: "คว้าตะกร้าขนมแล้ววิ่งหนีไปกับตัวร้าย", effects: { villainAlly: 2, suspicion: 1, flags: ["basketGrab"] }, memory: "คว้าตะกร้าขนมวิ่งหนีไปกับตัวร้าย" },
            { id: "s9-freeze", label: "ยกแอปเปิ้ลขึ้นเหมือนธงขาวแล้วยืนนิ่ง", effects: { suspicion: 2 }, memory: "ยกแอปเปิ้ลเป็นธงขาวกลางห้อง" },
          ],
        },
  // 10
  ({ has }) =>
    has("basketGrab")
      ? {
          location: "deep-forest",
          characters: [{ id: "villain", x: 68, height: 50 }, P(28, false)],
          title: "ตะกร้าในมือ",
          paragraphs: [
            "คุณกับหมาป่าตัวร้ายวิ่งจนหอบมาหยุดกลางป่าทึบ ตะกร้าขนมยังอุ่น ๆ ส่งกลิ่นเนยหอมฟุ้ง",
            "“เยี่ยมเลยหุ้นส่วน!” มันยื่นอุ้งเท้ามาหา",
          ],
          question: "ตอนจบของคุณกับตะกร้าใบนี้คือ?",
          choices: [
            { id: "s10-return", label: "แอบนำตะกร้ากลับไปวางหน้าบ้านคุณยาย", effects: { help: 1, villainAlly: -3, flags: ["returned"] }, memory: "แอบนำตะกร้ากลับไปคืน" },
            { id: "s10-share", label: "แบ่งพายกันคนละครึ่งใต้แสงแดด", effects: { villainAlly: 1, flags: ["sharedSnack"] }, memory: "แบ่งพายกับหุ้นส่วนเขี้ยวแสบ" },
            { id: "s10-drop", label: "วางตะกร้าไว้ แล้วกลับไปกินแอปเปิ้ลคนเดียว", effects: { withdraw: 2, villainAlly: -2 }, memory: "วางตะกร้าแล้วกลับไปกินแอปเปิ้ล" },
          ],
        }
      : {
          location: "apple-tree",
          characters: [P(30)],
          title: "กลับมาที่ต้นแอปเปิ้ล",
          paragraphs: [
            "เรื่องวุ่น ๆ ในวันนี้เริ่มสงบลง คุณเดินกลับมาถึงต้นแอปเปิ้ลต้นเดิม ใบไม้ยังไหวเบา ๆ เหมือนไม่มีอะไรเกิดขึ้น",
            has("pointedVillain") ? "ไกล ๆ ได้ยินเสียงนายพรานพาหมาป่าตัวร้ายไปส่งไกลถึงอีกฝั่งภูเขา" : "ไม่มีใครรู้ว่าหมาป่าตัวร้ายหายไปไหน",
          ],
          question: "คุณจะปิดวันนี้อย่างไร?",
          choices: [
            { id: "s10-quiet", label: "เก็บเรื่องทั้งหมดไว้เป็นความลับคนเดียว", effects: { flags: ["quiet"] }, memory: "เก็บเรื่องทั้งหมดไว้เป็นความลับ" },
            { id: "s10-tell", label: "ไปเล่าความจริงทั้งหมดให้ทุกคนฟัง", effects: { trust: 1, suspicion: -3, witnesses: ["grandma"], flags: ["credited"] }, memory: "กลับไปเล่าความจริงให้ทุกคนฟัง" },
            { id: "s10-nap", label: "นอนเอนหลังกินแอปเปิ้ลลูกใหม่ ช่างมันเถอะ", effects: { withdraw: 2 }, memory: "นอนกินแอปเปิ้ลอย่างสบายใจ" },
          ],
        },
];

export function buildScene(index: number, state: GameState, wolfName: string, history: AnswerRecord[]): Scene {
  const def = scenes[index];
  if (!def) throw new Error(`No scene ${index}`);
  const has = (f: string) => state.flags.includes(f);
  return { id: `s${index + 1}`, index, ...def({ s: state, has, name: wolfName, history }) };
}
