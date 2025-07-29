const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walker = require('estree-walker').walk;

// Настройки пути директории с файлами для анализа
const dirPath = './parse'; // путь к директории с файлами

// Объекты хранения результатов анализа
let classes = [];
let methods = [];
let properties = [];
let globalFunctions = [];
let variablesAndConstants = [];

// Функция рекурсивного чтения всех js-файлов в указанной директории
function readDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            readDirectory(fullPath); // Рекурсия для вложенных каталогов
        } else if (file.endsWith('.js')) { // Проверка расширения файла .js
            analyzeFile(fullPath);
        }
    }
}

// Анализ одного файла с использованием Acorn и Estree Walker
function analyzeFile(filePath) {
    try {
        console.log(`Анализируем файл ${filePath}`);
        const code = fs.readFileSync(filePath, 'utf8');
        const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

        walker(ast, {
            enter(node) {
                switch (node.type) {
                    case 'ClassDeclaration':
                        handleClassDeclaration(node);
                        break;
                    case 'MethodDefinition':
                        handleMethodDefinition(node);
                        break;
                    case 'PropertyDefinition':
                        handlePropertyDefinition(node);
                        break;
                    case 'FunctionDeclaration':
                        handleGlobalFunction(node);
                        break;
                    case 'VariableDeclarator':
                        handleVariableOrConstant(node);
                        break;
                }
            },
        });
    } catch (err) {
        console.error(`Ошибка при обработке файла ${filePath}:`, err.message);
    }
}

// Обработка объявления класса
function handleClassDeclaration(classNode) {
    let className = classNode.id.name;
    if (!classes.includes(className)) {
        classes.push(className);
    }
}

// Обработка метода класса
function handleMethodDefinition(methodNode) {
    let methodName = methodNode.key.name || methodNode.key.value;
    if (!methods.includes(methodName)) {
        methods.push(methodName);
    }
}

// Обработка определения свойства класса
function handlePropertyDefinition(propertyNode) {
    let propertyName = propertyNode.key.name || propertyNode.key.value;
    if (!properties.includes(propertyName)) {
        properties.push(propertyName);
    }
}

// Обработка глобальной функции
function handleGlobalFunction(functionNode) {
    let functionName = functionNode.id.name;
    if (!globalFunctions.includes(functionName)) {
        globalFunctions.push(functionName);
    }
}

// Обработка объявлений переменных и констант
function handleVariableOrConstant(variableNode) {
    variableNode.idents.forEach((ident) => {
        if (!variablesAndConstants.includes(ident.name)) {
            variablesAndConstants.push(ident.name);
        }
    });
}

// Запуск анализа всей директории
readDirectory(dirPath);

console.log("Обнаружены классы:", classes);
console.log("Методы классов:", methods);
console.log("Свойства классов:", properties);
console.log("Глобальные функции:", globalFunctions);
console.log("Переменные и константы:", variablesAndConstants);