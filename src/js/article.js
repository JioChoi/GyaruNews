let id = null;

window.onbeforeunload = function () {
	window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM LOADED!!!");
	id = window.location.pathname.split('/')[2];

	loadComments();

	document.getElementById('url').addEventListener('click', () => {
		navigator.clipboard.writeText(url.innerText);
		alert('記事のURLをコピーしました');
	});

	document.getElementById('report').addEventListener('click', () => {
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

	document.getElementById('like').addEventListener('click', async () => {
		if (window.localStorage.getItem(id) == 'true') {
			alert('既に反応しています');
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
			alert('既に反応しています');
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
		alert('コメントを書いてください');
		return;
	}

	alert('コメントが投稿されました');

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