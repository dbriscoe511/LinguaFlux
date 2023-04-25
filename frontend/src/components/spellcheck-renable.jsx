

export function hasMisspelledWord(event) {
    const target = event.target;
    console.log("spellcheck test", target.spellcheck)
    if (!target.spellcheck) {
        return false;
    } else {
        return true;
    }
  
    const caretPos = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (!caretPos) {
      return false;
    }
  
    const textNode = caretPos.offsetNode;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return false;
    }
  
    const misspelledWords = textNode.parentElement.getClientRects();
    return Array.from(misspelledWords).some(rect =>
      rect.left <= event.clientX && event.clientX <= rect.right &&
      rect.top <= event.clientY && event.clientY <= rect.bottom
    );
  }