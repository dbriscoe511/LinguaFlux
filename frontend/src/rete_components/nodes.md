<h2>LLM Parts</h2>

**LLM Completion**

*Usage:*
- Connect a `Model` from the dropdown or input.
- Connect the `Message` input to provide a message.
- Press *Confirm* to fetch the completion response.

*Outputs:* `Last response` returns the generated completion response.

*Why use it?* Use this component to generate a completion response using an AI model and an input message, and integrate it with other nodes in your flowchart.

*Related Components:* [LLM Chat Completion](link4/chat-completion) for managing chat conversations, [LLM Chat Box](link4/chat-box) for a chatGPT-like interface, and [Paragraph Input](link4/paragraph-input) for dynamic text input with value substitution.

*Learn More:* [System message guidelines](link3), [Text vs Chat Socket](link1) differences.

**LLM Chat Completion**
*Usage:* 
- The `Message` socket must be connected to an input message
- Select the `Model` from the dropdown or connect it.
- Use the default [system message](link3) or connect it
- Connect the `Chat` socket to another chat node to use that node's conversation history.

*Outputs:* `Last response` returns the AI model's response, and `Full Chat` returns the updated list of messages.[Text vs Chat Socket](link1)

*Why use it?* Use this component to interact with AI models in a chat format, manage chat conversations, and integrate with other nodes in your flowchart.

*Related Components:* [LLM Chat Box](link4) if you want a chatGPT-like interface to accomplish the same thing.

**Chat box**
*Usage:* 
- Either connect a message to the `Message override` and hit the `Message overide` button, or type a message in the input box and hit `Send`
- Select the `Model` from the dropdown or connect it.
- Use the default [system message](link3) or connect it
- Connect the `Chat` socket to another chat node to use that node's conversation history.

*Outputs:* `Last response` returns the AI model's response, and `Full Chat` returns the updated list of messages.[Text vs Chat Socket](link1)

*Why use it?* Use this component to interact with AI models with a chatGPT like interface, manage chat conversations, and integrate with other nodes in your flowchart.

*Related Components:* [LLM Chat Box](link4) if you want a to use a more node based structure to interact with chat models. 

<h2>Input/prompting Parts</h2>

**Paragraph Input**
*Usage:*
- Enter your text prompt. You can use curly brakets to create an input to the node(e.g., `Hello, {name}!`). If you want to enter code, wrap it in markdown formatting to prevent curly brakets from becoming inputs, \`\`\` like this \`\`\`
- The component generates input sockets for each placeholder to connect other nodes or input values.

*Outputs:* `Text` returns the created text with the placeholders replaced by the connected input values.

*Why use it?* Use this component to create reusable prompts to interact AI models, or to consolidate AI models outputs

*Related Components:* [Codeinput](link4) a similar part made for entering code that does not process dynamic inputs, [Single-Line Text Input](link4) for a shorter way to enter test. 

**Single-Line Text Input**
*Usage:* 
- Connect the `Output` socket to any node that requires a single-line text input.

*Outputs:* The component outputs the entered single-line text.

*Why use it?* Use this component to provide single-line text input for various nodes in your flowchart, such as labels, values, or parameters.

*Related Components:* [Multi-Line Code Input](link4) for multi-line text input purposes.

**Code Input**
*Usage:* 
- Enter your code in the text area provided.
- Connect the `Text` output socket to other nodes as needed.

*Outputs:* `Text` returns the code you entered.

*Why use it?* Use this component to input code and connect it to other nodes in your flowchart.

*Related Components:* [Paragraph Input](link4) for dynamic text input with user-defined values.

**Text display**
*Usage:* 
- Connect a text input source to the `text` input socket to display it.

*Outputs:* N/A

*Why use it?* Use this component to display text on the screen, or the output of a language model.