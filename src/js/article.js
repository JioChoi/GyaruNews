let id = null;

window.onbeforeunload = function () {
	window.scrollTo(0, 0);
}

startLoadingArticle();

async function startLoadingArticle() {
	console.log("Loading article...");

	id = new URLSearchParams(location.search).get('id');
	if (!id || id.length != 10) {
		location.href = '/';
		return;
	}

	let response = await fetch(`${host}/api/article/${id}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	response = await response.json();
	writeContent(response);
}

document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM LOADED!!!");
	id = new URLSearchParams(location.search).get('id');

	loadComments();

	document.getElementById('like').addEventListener('click', async () => {
		if (window.localStorage.getItem(id) == 'true') {
			alert('Already reacted!')
			return;
		}

		window.localStorage.setItem(id, 'true');

		let response = await fetch(`${host}/api/react`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: id,
				reaction: 'like'
			})
		});
		response = await response.json();
		document.getElementById('like_count').innerText = response.likes;
	});

	document.getElementById('dislike').addEventListener('click', async () => {
		if (window.localStorage.getItem(id) == 'true') {
			alert('Already reacted!')
			return;
		}
		
		window.localStorage.setItem(id, 'true');

		let response = await fetch(`${host}/api/react`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: id,
				reaction: 'dislike'
			})
		});
		response = await response.json();
		document.getElementById('dislike_count').innerText = response.dislikes;
	});

	document.getElementById('edit').addEventListener('input', () => {
		document.getElementById('edit').style.height = 'auto';
		document.getElementById('edit').style.height = document.getElementById('edit').scrollHeight - 20 + 'px';
	});
});

async function loadComments() {
	let response = await fetch(`${host}/api/comments/${id}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	response = await response.json();
	document.getElementById('comment_num').innerText = "コメント　" + response.length + "件";

	document.getElementById("comments").innerHTML = "";
	
	response.forEach((comment) => {
		addComment(comment.name, comment.comment);
	});

}

function writeContent(response) {
	let title = document.createElement('h1');
	title.innerText = response.title;
	document.title = response.title;

	let date = document.createElement('h3');
	date.innerText = getDateString(response.date);

	let div = document.createElement('div');
	div.classList.add('actions');

	let url = document.createElement('div');
	url.classList.add('url');
	url.innerText = "https://gyarunews.com/article?id=" + response.id;

	url.addEventListener('click', () => {
		navigator.clipboard.writeText(url.innerText);
		alert('投稿アドレスがコピーされました');
	});

	let report = document.createElement('div');
	report.innerText = "通報";
	report.classList.add('report');

	div.appendChild(url);
	div.appendChild(report);

	report.addEventListener('click', () => {
		let yes = confirm('このコメントを通報しますか？');
		if (yes) {
			fetch(`${host}/api/report`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: id
				})
			});
			alert('通報が受理されました');
		}
	});

	let h4 = document.createElement('h4');
	h4.innerText = "(記事の内容と関係ない場合があります。)";
	
	let img = document.createElement('img');
	if (response.img.substring(0, 4) == 'http') {
		img.src = response.img;
	}
	else {
		img.src = `https://image.pollinations.ai/prompt/${response.img}`;
		h4.innerText = "(AI가 생성한 이미지 입니다. 실제와 다를 수 있습니다.)";
	}

	let content = document.getElementById('content');
	// Remove multiple spaces
	response.article = response.article.replaceAll('    ', ' ');
	response.article = response.article.replaceAll('   ', ' ');
	response.article = response.article.replaceAll('  ', ' ');

	let data = response.article;

	let h5 = document.createElement('h5');
	h5.innerHTML = "この記事は<strong>ギャルニュースAI</strong>が制作しました。";

	// Remove first children
	content.removeChild(content.firstElementChild);

	data += '\n';

	content.prepend(h5);

	let buffer = "";
	for (let i = 0; i < data.length; i++) {
		let char = data[i];

		if (char == '\n' && buffer.length > 1) {
			let p = document.createElement('p');
			p.innerHTML = buffer;
			content.insertBefore(p, h5);
			buffer = "";
		}

		if (char != '\n') {
			if (char == '♡') {
				buffer += '<span class="hearts" onclick="heart(this)">&#9825;</span>';
			}
			else {
				buffer += char;
			}
		}
	}

	content.prepend(h4);
	content.prepend(img);
	content.prepend(div);
	content.prepend(date);
	content.prepend(title);

	document.getElementById('like_count').innerText = response.likes;
	document.getElementById('dislike_count').innerText = response.dislikes;
}

function heart(hearts) {
	let ele = document.createElement('span');
	ele.innerText = '♥';
	ele.classList.add('heart');
	ele.classList.add("animate");

	let rect = hearts.getBoundingClientRect();

	ele.style.top = rect.top + 'px';
	ele.style.left = rect.left + 'px';

	let int = setInterval(() => {
		let rand = Math.random() * 30 - 15;
		ele.style.left = rect.left + rand + 'px';
	}, 100);
	
	setTimeout(() => {
		clearInterval(int);
		ele.remove();
	}, 1000);

	document.body.prepend(ele);
}

function addComment(name, value) {
	let div = document.createElement('div');
	div.classList.add('item');

	let h3 = document.createElement('h3');
	h3.innerText = name;

	h3.style.color = `hsl(${parseInt(name.substring(0, 2), 16) / 255.0 * 360}, 70%, 50%)`;

	let p = document.createElement('p');
	p.innerText = value;

	div.appendChild(h3);
	div.appendChild(p);
	
	document.getElementById("comments").appendChild(div);
}

async function submit() {
	let comment = document.getElementById('edit').value.trim();
	if (comment.length < 1) {
		alert('コメントを入力してください。');
		return;
	}

	alert('コメントを書きました。');

	await fetch(`${host}/api/comment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			id: id,
			comment: comment
		})
	});

	loadComments();

	document.getElementById('edit').value = '';
}