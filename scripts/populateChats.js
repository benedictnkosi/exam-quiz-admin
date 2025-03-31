"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var firebaseConfig = {
    // Add your Firebase config here
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
// Sample data arrays - using fewer users for a more focused conversation
var userNames = ['Test16', 'MathWhiz', 'AlgebraKing'];
var authorUIDs = [
    'SEvWWOLunQfQe2772FCSmZvUrz72',
    'KLmNoPqRsTuVwXyZ1234567890',
    'AbCdEfGhIjKlMnOpQrStUvWxYz'
];
// Single thread ID for the conversation
var threadId = 'ViKS5HjUeT9bj5fnNF1u';
// Sequential messages about solving for x
var conversationFlow = [
    {
        userName: 'Test16',
        text: 'Can someone help me solve this equation? 2x + 5 = 13'
    },
    {
        userName: 'MathWhiz',
        text: 'Sure! Let\'s solve it step by step. First, subtract 5 from both sides to isolate the term with x'
    },
    {
        userName: 'Test16',
        text: 'Okay, so that gives me 2x = 8, right?'
    },
    {
        userName: 'MathWhiz',
        text: 'Exactly! Now divide both sides by 2 to solve for x'
    },
    {
        userName: 'Test16',
        text: 'So x = 4! Did I get that right?'
    },
    {
        userName: 'AlgebraKing',
        text: 'Perfect! You can check by plugging 4 back into the original equation: 2(4) + 5 = 13'
    },
    {
        userName: 'Test16',
        text: 'Thanks! Can we try another one? How about 3x - 7 = 14'
    },
    {
        userName: 'MathWhiz',
        text: 'Go ahead and try solving it using the same steps we just learned!'
    },
    {
        userName: 'Test16',
        text: 'First I add 7 to both sides: 3x = 21'
    },
    {
        userName: 'Test16',
        text: 'Then divide by 3... so x = 7?'
    },
    {
        userName: 'AlgebraKing',
        text: 'Excellent work! You\'re getting really good at this!'
    },
    {
        userName: 'Test16',
        text: 'This makes so much more sense now. Can we try something harder next time?'
    }
];
function addSequentialMessage(messageData, delay) {
    return __awaiter(this, void 0, void 0, function () {
        var userIndex, data, docRef, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userIndex = userNames.indexOf(messageData.userName);
                    data = {
                        authorUID: authorUIDs[userIndex],
                        createdAt: firestore_1.Timestamp.fromDate(new Date(Date.now() + delay)),
                        text: messageData.text,
                        threadId: threadId,
                        userName: messageData.userName
                    };
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, 'messages'), data)];
                case 1:
                    docRef = _a.sent();
                    console.log('Message added with ID: ', docRef.id);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error adding message: ', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to add the conversation sequentially
function populateConversation() {
    return __awaiter(this, void 0, void 0, function () {
        var i, delay;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Adding conversation messages...');
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < conversationFlow.length)) return [3 /*break*/, 5];
                    delay = i * 60000;
                    return [4 /*yield*/, addSequentialMessage(conversationFlow[i], delay)];
                case 2:
                    _a.sent();
                    // Small delay in script execution to avoid overwhelming database
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 3:
                    // Small delay in script execution to avoid overwhelming database
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5:
                    console.log('Finished adding conversation');
                    return [2 /*return*/];
            }
        });
    });
}
// Add the conversation
populateConversation().then(function () {
    console.log('Script completed');
    process.exit(0);
}).catch(function (error) {
    console.error('Error running script:', error);
    process.exit(1);
});
