package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePostReply ...
type TableTypePostReply struct {
}

// PostReply ...
var PostReply = &TableTypePostReply{}

// ------------ Actions ------------

// InsertPostReply ...
func (da *TableTypePostReply) InsertPostReply(queryable dbx.Queryable, toUserID uint64, userID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post_cmt_rpl` (`to_user_id`, `user_id`) VALUES (?, ?)", toUserID, userID)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
