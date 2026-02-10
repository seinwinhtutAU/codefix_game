type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  title: string;
  description: string;
  codeSnippet: string;
  language: "python" | "javascript";
  options: Option[];
  correctOptionId: string;
  explanation: string;
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Quiz 1",
    description: "Why does this code produce a SyntaxError?",
    codeSnippet: `print("Hello, World!"`,
    language: "python",
    options: [
      {
        id: "A",
        text: "The print statement is missing quotes around the text.",
      },
      {
        id: "B",
        text: "The print function call is missing a closing parenthesis.",
      },
      { id: "C", text: "Python doesn't support the print function." },
      { id: "D", text: "The text should not have a comma in it." },
    ],
    correctOptionId: "B",
    explanation:
      "Correct! The print() function call has an opening parenthesis but no closing one. Python expects every '(' to be matched with a ')'.",
  },
  {
    id: "q2",
    title: "Quiz 2",
    description: "What causes the TypeError in this code?",
    codeSnippet: `age = 25
message = "I am " + age + " years old"
print(message)`,
    language: "python",
    options: [
      { id: "A", text: "The variable 'age' is not properly initialized." },
      {
        id: "B",
        text: "You cannot use the + operator to combine strings and integers.",
      },
      { id: "C", text: "The message variable name is invalid." },
      { id: "D", text: "You need to use commas instead of + to join strings." },
    ],
    correctOptionId: "B",
    explanation:
      "Right! Python doesn't automatically convert integers to strings when using the + operator. You need to convert the integer to string first: str(age).",
  },
  {
    id: "q3",
    title: "Quiz 3",
    description:
      "Why does this code always print 'Too young' even when age is 18?",
    codeSnippet: `age = 18
if age = 18:
    print("You're exactly 18!")
else:
    print("Too young")`,
    language: "python",
    options: [
      {
        id: "A",
        text: "The if statement should use == for comparison, not =.",
      },
      { id: "B", text: "The else statement is missing a colon." },
      { id: "C", text: "The variable age should be a string, not an integer." },
      { id: "D", text: "The print statements are missing parentheses." },
    ],
    correctOptionId: "A",
    explanation:
      "Exactly! = is the assignment operator, while == is the comparison operator. Using = in an if statement is a syntax/logic error.",
  },
  {
    id: "q4",
    title: "Quiz 4",
    description: "What's wrong with this function definition?",
    codeSnippet: `def greet_user(name)
    print("Hello, " + name)

greet_user("Alice")`,
    language: "python",
    options: [
      { id: "A", text: "The function name should be capitalized." },
      {
        id: "B",
        text: "The function definition is missing a colon at the end.",
      },
      { id: "C", text: "The parameter 'name' is not a valid variable name." },
      { id: "D", text: "The print statement should use f-strings." },
    ],
    correctOptionId: "B",
    explanation:
      "Correct! Function definitions in Python must end with a colon (:). This tells Python that what follows is the function body.",
  },
  {
    id: "q5",
    title: "Quiz 5",
    description: "Why does this loop run forever?",
    codeSnippet: `x = 0
while x < 5:
    print(x)`,
    language: "python",
    options: [
      { id: "A", text: "The while condition is incorrect." },
      {
        id: "B",
        text: "The variable x never changes, so the condition is always true.",
      },
      { id: "C", text: "Python doesn't support while loops." },
      { id: "D", text: "The print statement should be outside the loop." },
    ],
    correctOptionId: "B",
    explanation:
      "Spot on! The variable x is never incremented, so x < 5 remains true forever. The loop needs x += 1 inside it to change the condition.",
  },
  {
    id: "q6",
    title: "Quiz 6",
    description: "What error will this code produce?",
    codeSnippet: `def calculate_area(length, width):
area = length * width
    return area

result = calculate_area(5, 3)`,
    language: "python",
    options: [
      { id: "A", text: "The function parameters are incorrect." },
      { id: "B", text: "The area calculation formula is wrong." },
      {
        id: "C",
        text: "The code inside the function is not properly indented.",
      },
      { id: "D", text: "The function call has too many arguments." },
    ],
    correctOptionId: "C",
    explanation:
      "Exactly! Python uses indentation to define code blocks. All code inside a function must be indented (usually by 4 spaces).",
  },
  {
    id: "q7",
    title: "Quiz 7",
    description: "What's wrong with this list operation?",
    codeSnippet: `fruits = ["apple", "banana", "cherry"]
fruits.append("orange")
fruits.append("grape")
fruits.append()
print(fruits)`,
    language: "python",
    options: [
      { id: "A", text: "The list is already full." },
      { id: "B", text: "The append() method is called without an argument." },
      { id: "C", text: "Fruits should be stored in a tuple, not a list." },
      { id: "D", text: "The print statement is in the wrong place." },
    ],
    correctOptionId: "B",
    explanation:
      "Correct! The append() method requires an argument - the item to add to the list. Calling it without an argument causes an error.",
  },
  {
    id: "q8",
    title: "Quiz 8",
    description: "Why does this code throw a NameError?",
    codeSnippet: `student_name = "John"
student_age = 20
print("Name:", student_name, "Age:", student_ag)`,
    language: "python",
    options: [
      { id: "A", text: "The variables should be declared differently." },
      {
        id: "B",
        text: "There's a typo in the variable name (student_ag instead of student_age).",
      },
      { id: "C", text: "Print cannot handle multiple arguments." },
      { id: "D", text: "The variable names are too long." },
    ],
    correctOptionId: "B",
    explanation:
      "Exactly! This is a common typo error. We defined 'student_age' but tried to print 'student_ag' (missing the 'e'). Python can't find this variable.",
  },
  {
    id: "q9",
    title: "Quiz 9",
    description: "What error occurs when running this code?",
    codeSnippet: `numerator = 10
denominator = 0
result = numerator / denominator
print(result)`,
    language: "python",
    options: [
      { id: "A", text: "SyntaxError - invalid math operation" },
      { id: "B", text: "NameError - result is not defined" },
      { id: "C", text: "ZeroDivisionError - cannot divide by zero" },
      { id: "D", text: "TypeError - wrong data types used" },
    ],
    correctOptionId: "C",
    explanation:
      "Right! Dividing any number by zero is mathematically undefined. Python raises a ZeroDivisionError to prevent this illegal operation.",
  },
  {
    id: "q10",
    title: "Quiz 10",
    description: "Why does this function always return None?",
    codeSnippet: `def add_numbers(a, b):
    total = a + b

result = add_numbers(5, 3)
print(result)  # Prints None instead of 8`,
    language: "python",
    options: [
      { id: "A", text: "The function parameters are wrong." },
      { id: "B", text: "The function doesn't have a return statement." },
      { id: "C", text: "The variables a and b are not initialized." },
      { id: "D", text: "The function should be called differently." },
    ],
    correctOptionId: "B",
    explanation:
      "Correct! Functions without an explicit return statement automatically return None. The function calculates total but doesn't return it.",
  },
  {
    id: "q11",
    title: "Quiz 11",
    description: "Why does this code produce an IndexError?",
    codeSnippet: `colors = ["red", "green", "blue"]
print(colors[1])
print(colors[2])
print(colors[3])`,
    language: "python",
    options: [
      { id: "A", text: "Lists in Python cannot contain string values." },
      { id: "B", text: "The print statements are in the wrong order." },
      {
        id: "C",
        text: "The list index 3 doesn't exist because lists are 0-indexed and this list has only 3 items.",
      },
      { id: "D", text: "Python lists start indexing from 1, not 0." },
    ],
    correctOptionId: "C",
    explanation:
      "Correct! Python lists are 0-indexed, meaning the first element is at index 0. A list with 3 elements has valid indices 0, 1, and 2. Index 3 is out of range.",
  },
  {
    id: "q12",
    title: "Quiz 12",
    description: "Why does this code throw a KeyError?",
    codeSnippet: `student_grades = {"Alice": 95, "Bob": 87, "Charlie": 92}
print(student_grades["alice"])`,
    language: "python",
    options: [
      { id: "A", text: "Dictionary keys must be numbers, not strings." },
      {
        id: "B",
        text: "The key 'alice' doesn't exist because Python dictionary keys are case-sensitive.",
      },
      { id: "C", text: "Dictionaries cannot be printed directly." },
      { id: "D", text: "The dictionary is missing a closing bracket." },
    ],
    correctOptionId: "B",
    explanation:
      "Exactly! Dictionary keys in Python are case-sensitive. 'Alice' and 'alice' are different keys. The dictionary has 'Alice' (with capital A), but the code tries to access 'alice' (lowercase a).",
  },
];
