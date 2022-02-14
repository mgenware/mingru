package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePostReply struct {
}

var PostReply = &TableTypePostReply{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePostReply) MingruSQLName() string {
	return "post_cmt_rpl"
}

// ------------ Actions ------------

func (mrTable *TableTypePostReply) InsertPostReply(mrQueryable mingru.Queryable, toUserID uint64, userID uint64) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `post_cmt_rpl` (`to_user_id`, `user_id`) VALUES (?, ?)", toUserID, userID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
