package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

func (da *TableTypePost) tChild1(queryable mingru.Queryable, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, rplCount uint) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `cmt` (`content`, `user_id`, `created_at`, `modified_at`, `rpl_count`) VALUES (?, ?, ?, ?, ?)", content, userID, createdAt, modifiedAt, rplCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (da *TableTypePost) tChild2(queryable mingru.Queryable, postID uint64, cmtID uint64) error {
	_, err := queryable.Exec("INSERT INTO `post_cmt` (`post_id`, `cmt_id`) VALUES (?, ?)", postID, cmtID)
	return err
}

// T ...
func (da *TableTypePost) T(db *sql.DB, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, rplCount uint, postID uint64, cmtID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = da.tChild1(tx, content, userID, createdAt, modifiedAt, rplCount)
		if err != nil {
			return err
		}
		err = da.tChild2(tx, postID, cmtID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
