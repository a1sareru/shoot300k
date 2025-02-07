// 提交选卡，显示结果
document.getElementById('submit-cards').addEventListener('click', () => {
    const selectedCards = document.querySelectorAll('.card.selected');
    const selectedIds = Array.from(selectedCards).map(card => {
        const id = Number(card.dataset.id);
        return id >= 337 ? id - 19 : id;
    });
    const idString = selectedIds.join(',');
    document.getElementById('selected-ids').innerText = idString;
    const copyButton = document.getElementById('copy-result');
    copyButton.style.display = idString.trim().length > 0 ? 'inline-block' : 'none';
});

// 复制功能
document.getElementById('copy-result').addEventListener('click', () => {
    const resultText = document.getElementById('selected-ids').innerText;
    navigator.clipboard.writeText(resultText)
        .then(() => { alert('结果已复制到剪贴板'); })
        .catch(err => { alert('复制失败，请手动复制'); console.error(err); });
});
