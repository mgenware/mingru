package da

import (
	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePostCmtRpl ...
type TableTypePostCmtRpl struct {
}

// PostCmtRpl ...
var PostCmtRpl = &TableTypePostCmtRpl{}

// ------------ Actions ------------

// InsertPostReply ...
func (da *TableTypePostCmtRpl) InsertPostReply(queryable dbx.Queryable, toUserID uint64, userID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post_cmt_rpl` (`to_user_id`, `user_id`) VALUES (?, ?)", toUserID, userID)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
