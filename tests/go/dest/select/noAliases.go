package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePostCmt ...
type TableTypePostCmt struct {
}

// PostCmt ...
var PostCmt = &TableTypePostCmt{}

// ------------ Actions ------------

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	AliasInJoin     time.Time
	ModelVotes      int
	PascalCaseAlias time.Time
	VotesTime       time.Time
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable mingru.Queryable, targetUserUrlName string) (PostCmtTableSelectTResult, error) {
	var result PostCmtTableSelectTResult
	err := queryable.QueryRow("SELECT `post_cmt`.`db_votes`, `post_cmt`.`db_votes`, `join_1`.`time`, `join_1`.`time`, `join_1`.`time` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`db_votes` WHERE `join_1`.`reviewer_id` ?", targetUserUrlName).Scan(&result.ModelVotes, &result.VotesTime, &result.AliasInJoin, &result.PascalCaseAlias)
	if err != nil {
		return result, err
	}
	return result, nil
}
