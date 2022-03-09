package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) tChild1(mrQueryable mingru.Queryable, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, rplCount uint) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `cmt` (`content`, `user_id`, `created_at`, `modified_at`, `rpl_count`) VALUES (?, ?, ?, ?, ?)", content, userID, createdAt, modifiedAt, rplCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *TableTypePost) tChild2(mrQueryable mingru.Queryable, postID uint64, cmtID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `post_cmt` (`post_id`, `cmt_id`) VALUES (?, ?)", postID, cmtID)
	return err
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, postID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.tChild1(tx, content, userID, createdAt, modifiedAt, rplCount)
		if err != nil {
			return err
		}
		err = mrTable.tChild2(tx, postID, cmtID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
