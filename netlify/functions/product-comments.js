async function deleteComment(commentId) {
    if (!confirm('Delete this review permanently?')) return;

    try {
        const res = await fetch('/api/product-comments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                comment_id: commentId, 
                user_id: currentUser.id  // keep as is — backend will handle
            })
        });

        if (!res.ok) throw new Error('Delete failed');

        if (typeof showToast === 'function') showToast('Review deleted');
        loadComments();
    } catch (err) {
        alert('Error deleting review');
    }
}